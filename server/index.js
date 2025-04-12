
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
const FormData = require("form-data");
const { callOllamaForExtraction } = require("./callOllamaForExtraction");
const { distance } = require("fastest-levenshtein");

const app = express();
const PORT = process.env.PORT || 5000;

console.log("starting the server");

// Supabase client setup
const supabaseUrl = "https://sjqezbfqmwfwbutgzwqd.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// OCR Space API Key
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || "";

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Configure multer for memory storage
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Only PDF, JPEG, PNG, and WebP files are allowed!"));
    }
    cb(null, true);
  },
});

// Find value by nearest label in OCR data
function findValueByLabel(ocrLines, labelText, proximityThreshold = 3) {
  // Find the line that contains the label
  const labelLine = ocrLines.find(line => 
    line.LineText.toLowerCase().includes(labelText.toLowerCase())
  );
  
  if (!labelLine) return null;
  
  // Look for a value on the same line (e.g. "Total: 100")
  const labelWords = labelLine.LineText.split(/\s+/);
  const valueInSameLine = labelWords[labelWords.length - 1];
  if (/[\d,.]+/.test(valueInSameLine)) {
    return parseFloat(valueInSameLine.replace(/,/g, '')) || 0;
  }
  
  // If not found, look for a value in a nearby line with similar Y position
  const labelY = labelLine.MinTop;
  const valueLines = ocrLines.filter(line => 
    // Line with just numbers, likely to be a value
    /^[\d,.\s]+$/.test(line.LineText.trim()) && 
    // Within proximity threshold of the label line
    Math.abs(line.MinTop - labelY) < 50
  );
  
  if (valueLines.length > 0) {
    // Sort by proximity to label line
    valueLines.sort((a, b) => 
      Math.abs(a.MinTop - labelY) - Math.abs(b.MinTop - labelY)
    );
    
    // Get the closest value
    const closestValueLine = valueLines[0];
    return parseFloat(closestValueLine.LineText.replace(/,/g, '')) || 0;
  }
  
  return null;
}

// Find GSTIN in OCR text
function findGSTIN(ocrLines) {
  const gstinPattern = /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/;
  
  for (const line of ocrLines) {
    const match = line.LineText.match(gstinPattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

// Find invoice number in OCR text
function findInvoiceNumber(ocrLines) {
  const invoiceLabels = ['invoice no', 'invoice number', 'bill no', 'bill number'];
  
  for (const line of ocrLines) {
    const lowerText = line.LineText.toLowerCase();
    
    for (const label of invoiceLabels) {
      if (lowerText.includes(label)) {
        // Extract text after the label
        const parts = lowerText.split(label);
        if (parts.length > 1) {
          const potentialNumber = parts[1].trim().replace(/[^a-zA-Z0-9\/\-]/g, '');
          if (potentialNumber) return potentialNumber;
        }
      }
    }
  }
  
  // If no invoice number found with labels, look for patterns like INV-12345
  const invoicePattern = /\b(?:INV|BILL)[\/\-]?[0-9A-Z]+\b/i;
  
  for (const line of ocrLines) {
    const match = line.LineText.match(invoicePattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

// Find date in OCR text
function findInvoiceDate(ocrLines) {
  // Common date patterns: DD/MM/YYYY, DD-MM-YYYY, etc.
  const datePatterns = [
    /\b([0-3]?[0-9])[\/\-\.]([0-1]?[0-9])[\/\-\.]([0-9]{4}|[0-9]{2})\b/,  // DD/MM/YYYY or DD/MM/YY
    /\b([0-9]{4})[\/\-\.]([0-1]?[0-9])[\/\-\.]([0-3]?[0-9])\b/,           // YYYY/MM/DD
    /\b([0-3]?[0-9])(?:st|nd|rd|th)?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+([0-9]{4})\b/i  // 15th June 2022
  ];
  
  const dateLabels = ['date', 'invoice date', 'bill date', 'dated'];
  
  // First look for dates near date labels
  for (const line of ocrLines) {
    const lowerText = line.LineText.toLowerCase();
    
    for (const label of dateLabels) {
      if (lowerText.includes(label)) {
        // Check this line and next few lines for date patterns
        let lineIndex = ocrLines.indexOf(line);
        for (let i = 0; i <= 2 && lineIndex + i < ocrLines.length; i++) {
          const textToCheck = ocrLines[lineIndex + i].LineText;
          
          for (const pattern of datePatterns) {
            const match = textToCheck.match(pattern);
            if (match) {
              try {
                // Try to parse as a valid date
                let dateStr;
                if (pattern === datePatterns[0]) {
                  dateStr = `${match[3].length === 2 ? '20' + match[3] : match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
                } else if (pattern === datePatterns[1]) {
                  dateStr = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
                } else {
                  // Convert month name to number
                  const months = {jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', 
                                 jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'};
                  const month = months[match[2].toLowerCase().substring(0, 3)];
                  dateStr = `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
                }
                
                const date = new Date(dateStr);
                if (!isNaN(date.getTime())) {
                  return dateStr;
                }
              } catch (e) {
                // Skip invalid dates
                console.log("Invalid date format:", e);
              }
            }
          }
        }
      }
    }
  }
  
  // If no date found with labels, just look for any date pattern
  for (const line of ocrLines) {
    for (const pattern of datePatterns) {
      const match = line.LineText.match(pattern);
      if (match) {
        try {
          let dateStr;
          if (pattern === datePatterns[0]) {
            dateStr = `${match[3].length === 2 ? '20' + match[3] : match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          } else if (pattern === datePatterns[1]) {
            dateStr = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
          } else {
            const months = {jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', 
                           jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'};
            const month = months[match[2].toLowerCase().substring(0, 3)];
            dateStr = `${match[3]}-${month}-${match[1].padStart(2, '0')}`;
          }
          
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return dateStr;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
    }
  }
  
  return new Date().toISOString().split('T')[0]; // Default to today if no date found
}

// Find vendor name in OCR text
function findVendorName(ocrLines) {
  // Common vendor patterns in invoices
  const vendorLabels = ['from', 'seller', 'vendor', 'supplier', 'billed from', 'company'];
  
  for (const line of ocrLines) {
    const lowerText = line.LineText.toLowerCase();
    
    for (const label of vendorLabels) {
      if (lowerText.includes(label + ':') || lowerText === label) {
        // Check next few lines for potential vendor name
        let lineIndex = ocrLines.indexOf(line);
        // The vendor name is likely to be in the next line after the label
        if (lineIndex + 1 < ocrLines.length) {
          const nextLine = ocrLines[lineIndex + 1].LineText;
          // Simple heuristic: if the line is short and doesn't have numbers, it's likely a name
          if (nextLine.length < 50 && !/\d/.test(nextLine)) {
            return nextLine.trim();
          }
        }
        
        // If it's "label: value" format, extract the value part
        const parts = line.LineText.split(':');
        if (parts.length > 1 && parts[1].trim().length > 0) {
          return parts[1].trim();
        }
      }
    }
  }
  
  // If no vendor found with standard labels, look for patterns
  // like a line with title-case words in the first 10 lines (often the header)
  for (let i = 0; i < Math.min(10, ocrLines.length); i++) {
    const line = ocrLines[i].LineText.trim();
    // Check if it's a title-cased line with no numbers (likely a company name)
    if (line.length > 0 && 
        line.length < 50 && 
        /^[A-Z]/.test(line) && 
        !/\d/.test(line) &&
        !/invoice|bill|statement|receipt/i.test(line)) {
      return line;
    }
  }
  
  return "Unknown Vendor";
}

async function extractInvoiceDataFromBuffer(buffer, mimeType) {
  console.log("Extracting text from file using OCR.space...");

  const formData = new FormData();
  formData.append("apikey", OCR_SPACE_API_KEY);
  formData.append("language", "eng");
  formData.append("isTable", "true");
  formData.append("detectOrientation", "true");
  formData.append("scale", "true");
  formData.append("OCREngine", "2");
  formData.append("file", buffer, {
    filename: `invoice.${mimeType.split("/")[1]}`,
    contentType: mimeType,
  });

  try {
    // OCR Extraction
    const ocrResponse = await axios.post(
      "https://api.ocr.space/parse/image",
      formData,
      { headers: { ...formData.getHeaders() } }
    );

    if (!ocrResponse.data?.ParsedResults?.[0]) {
      throw new Error("Invalid OCR response format");
    }

    // Get the OCR text and lines data
    const rawText = ocrResponse.data.ParsedResults[0].ParsedText;
    const linesData = ocrResponse.data.ParsedResults[0].TextOverlay?.Lines || [];
    
    // Check if we got structured data
    if (linesData.length === 0) {
      throw new Error("No structured line data returned from OCR");
    }
    
    // Extract key invoice details from OCR data using spatial analysis
    const amount = findValueByLabel(linesData, "Total Amount") || 
                   findValueByLabel(linesData, "Total Amount After Tax") || 
                   findValueByLabel(linesData, "Grand Total") || 0;
                   
    const baseAmount = findValueByLabel(linesData, "Taxable Amount") || 
                       findValueByLabel(linesData, "Subtotal") || 
                       findValueByLabel(linesData, "Base Amount") || 0;
                       
    const gstAmount = findValueByLabel(linesData, "Total Tax") || 
                      findValueByLabel(linesData, "GST Amount") || 
                      findValueByLabel(linesData, "IGST") || 
                      findValueByLabel(linesData, "CGST") * 2 || // If CGST, assume SGST is same
                      0;
    
    const gstRate = gstAmount && baseAmount ? Math.round((gstAmount / baseAmount) * 100) : null;
    const vendor_gstin = findGSTIN(linesData);
    const invoice_number = findInvoiceNumber(linesData);
    const invoice_date = findInvoiceDate(linesData);
    const vendor_name = findVendorName(linesData);

    // Prepare the extracted data
    const extractedData = {
      invoice_number: invoice_number || `INV-${Date.now().toString().slice(-6)}`,
      invoice_date: invoice_date,
      vendor_name: vendor_name,
      vendor_gstin: vendor_gstin,
      amount: amount,
      gst_amount: gstAmount,
      gst_rate: gstRate,
      ocr_data: {
        raw_text: rawText,
        lines_data: linesData,
        extraction_time: new Date().toISOString(),
      },
      confidence_score: 70, // Base confidence score
    };

    // Ollama LLM Extraction as a backup
    try {
      const ollamaData = await callOllamaForExtraction(rawText);
      
      // Merge and prioritize structured extraction
      if (ollamaData) {
        // Use Ollama data as fallback if our extractions failed
        extractedData.invoice_number = extractedData.invoice_number || ollamaData.invoice_number;
        extractedData.invoice_date = extractedData.invoice_date || ollamaData.invoice_date;
        extractedData.vendor_name = extractedData.vendor_name || ollamaData.vendor_name;
        extractedData.vendor_gstin = extractedData.vendor_gstin || ollamaData.vendor_gstin;
        extractedData.amount = extractedData.amount || parseFloat(ollamaData.amount) || 0;
        extractedData.gst_amount = extractedData.gst_amount || parseFloat(ollamaData.gst_amount) || 0;
        extractedData.gst_rate = extractedData.gst_rate || parseFloat(ollamaData.gst_rate);
        
        // Increase confidence if multiple sources agree
        if (extractedData.amount && parseFloat(ollamaData.amount) && 
            Math.abs(extractedData.amount - parseFloat(ollamaData.amount)) < 1) {
          extractedData.confidence_score += 10;
        }
      }
    } catch (err) {
      console.warn("Ollama extraction failed, using only structured data:", err.message);
    }

    // Post-processing and automatic corrections
    const cleanedData = cleanAndCorrectExtractedData(extractedData, rawText);
    console.log("Extracted data:", cleanedData);
    
    return cleanedData;
  } catch (error) {
    console.error("Error processing invoice:", error.message);
    throw new Error(`Processing failed: ${error.message}`);
  }
}

// ------------------------
// SMART POST-PROCESSING
// ------------------------

function cleanAndCorrectExtractedData(extractedData, rawText) {
  let {
    invoice_number,
    invoice_date,
    vendor_name,
    vendor_gstin,
    amount,
    gst_amount,
    gst_rate,
    confidence_score,
    ocr_data
  } = extractedData;

  // Parse numeric fields safely
  amount = parseFloat(amount) || 0;
  gst_amount = parseFloat(gst_amount) || 0;
  gst_rate = parseFloat(gst_rate) || null;

  // Invoice number fallback from text
  if (!invoice_number && rawText) {
    const match = rawText.match(
      /invoice[\s_-]*no\.?[\s:-]*([A-Za-z0-9\/\-]+)/i
    );
    if (match) invoice_number = match[1].trim();
  }

  // Invoice date fallback
  if (!invoice_date && rawText) {
    const match = rawText.match(
      /(?:dated|date)[\s:-]*([0-9]{1,2}[-\/][A-Za-z]{3,9}[-\/][0-9]{2,4})/i
    );
    if (match) {
      const parsedDate = new Date(match[1]);
      if (!isNaN(parsedDate)) {
        invoice_date = parsedDate.toISOString().split("T")[0];
      }
    }
  }

  // GSTIN fallback using regex
  if (!vendor_gstin && rawText) {
    const match = rawText.match(
      /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/
    );
    if (match) vendor_gstin = match[0];
  }

  // Vendor name cleanup
  if (vendor_name) {
    vendor_name = vendor_name
      .replace(/(Pvt\.?\s*Ltd\.?|LLP|Inc\.?|Corp\.?|Company|Co\.?)$/i, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  // GST Rate calculation if missing
  if (!gst_rate && gst_amount && amount > gst_amount) {
    const base = amount - gst_amount;
    gst_rate = Math.round((gst_amount / base) * 100);
  }

  // GST Amount fallback
  if (!gst_amount && amount && gst_rate) {
    const base = amount / (1 + gst_rate / 100);
    gst_amount = parseFloat((amount - base).toFixed(2));
  }

  // Amount fallback
  if (!amount && gst_amount && gst_rate) {
    const base = (gst_amount * 100) / gst_rate;
    amount = parseFloat((base + gst_amount).toFixed(2));
  }

  // GST Rate validation - common GST rates in India
  if (gst_rate && ![0, 3, 5, 12, 18, 28].includes(gst_rate)) {
    // Find the closest standard GST rate
    const standardRates = [0, 3, 5, 12, 18, 28];
    const closest = standardRates.reduce((prev, curr) => 
      (Math.abs(curr - gst_rate) < Math.abs(prev - gst_rate) ? curr : prev)
    );
    
    if (Math.abs(closest - gst_rate) < 3) {
      // If close to a standard rate, adjust it
      gst_rate = closest;
      
      // Recalculate gst_amount based on corrected rate
      if (amount) {
        const base = amount / (1 + closest / 100);
        gst_amount = parseFloat((amount - base).toFixed(2));
      }
    }
  }

  // Calculate confidence score based on data completeness
  confidence_score = 60; // Base score
  if (invoice_number) confidence_score += 5;
  if (invoice_date) confidence_score += 5;
  if (vendor_name) confidence_score += 5;
  if (vendor_gstin) confidence_score += 10;
  if (amount > 0) confidence_score += 10;
  if (gst_amount > 0) confidence_score += 5;

  return {
    invoice_number: invoice_number || `INV-${Date.now().toString().slice(-6)}`,
    invoice_date: invoice_date || new Date().toISOString().split("T")[0],
    vendor_name: vendor_name || "Unknown Vendor",
    vendor_gstin: vendor_gstin || null,
    amount,
    gst_amount,
    gst_rate: gst_rate || null,
    ocr_data,
    confidence_score,
  };
}

// Function to check if invoice is a duplicate
async function checkDuplicateInvoice(userId, invoiceData) {
  try {
    const { data: existingInvoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId)
      .eq("invoice_number", invoiceData.invoice_number)
      .eq("invoice_date", invoiceData.invoice_date);

    if (existingInvoices?.length > 0) {
      // Check amount similarity to handle slight variations
      const hasSimilarAmount = existingInvoices.some(inv => 
        Math.abs(inv.amount - invoiceData.amount) < 0.01
      );
      
      if (hasSimilarAmount) {
        return {
          isDuplicate: true,
          existingInvoice: existingInvoices[0]
        };
      }
    }

    // Check for similar invoices (fuzzy match on invoice number)
    const { data: allInvoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", userId);

    if (allInvoices?.length > 0) {
      // Find invoices with similar numbers and dates
      const similarInvoices = allInvoices.filter(inv => {
        if (!inv.invoice_number) return false;
        
        // Check for similar invoice numbers using Levenshtein distance
        const numberSimilarity = distance(
          inv.invoice_number.toLowerCase(),
          invoiceData.invoice_number.toLowerCase()
        );
        
        // Check if dates are close (within 3 days)
        const date1 = new Date(inv.invoice_date);
        const date2 = new Date(invoiceData.invoice_date);
        const daysDiff = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));
        
        return numberSimilarity <= 2 && daysDiff <= 3;
      });
      
      if (similarInvoices.length > 0) {
        return {
          isPotentialDuplicate: true,
          similarInvoices
        };
      }
    }
    
    return { isDuplicate: false };
  } catch (error) {
    console.error("Error checking for duplicate invoice:", error);
    return { error: "Failed to check for duplicates" };
  }
}

// Invoice upload endpoint
app.post("/api/invoices/upload", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ error: "No files uploaded", success: false });
    }

    const { userId, invoiceType } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ error: "User ID is required", success: false });
    }

    console.log(
      `Processing ${req.files.length} file(s) for user ${userId}...`
    );

    const results = [];
    const errors = [];
    const duplicates = [];
    const potentialDuplicates = [];

    // Process each file one by one
    for (const file of req.files) {
      try {
        console.log(`Processing file: ${file.originalname}`);

        // Upload file to Supabase Storage
        const fileExt = file.originalname.substring(
          file.originalname.lastIndexOf(".")
        );
        const fileName = `${userId}/${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 10)}${fileExt}`;

        const { data: uploadData, error: uploadError } =
          await supabase.storage
            .from("invoices")
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              upsert: false,
            });

        if (uploadError) {
          errors.push({
            file: file.originalname,
            error: "Failed to upload to storage",
            details: uploadError.message
          });
          console.error("Upload error:", uploadError);
          continue;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("invoices").getPublicUrl(fileName);

        // Extract data using OCR.Space and Ollama
        const extractedData = await extractInvoiceDataFromBuffer(
          file.buffer,
          file.mimetype
        );

        // Determine invoice type
        let finalInvoiceType = invoiceType || "unknown";
        if (!invoiceType && finalInvoiceType === "unknown") {
          const lowerText = extractedData.ocr_data.raw_text.toLowerCase();
          if (
            ["sales", "invoice", "bill to"].some((k) => lowerText.includes(k))
          ) {
            finalInvoiceType = "sales";
          } else if (
            ["purchase", "vendor", "supplier"].some((k) =>
              lowerText.includes(k)
            )
          ) {
            finalInvoiceType = "purchase";
          }
        }

        // Check for duplicate invoices
        const duplicateCheck = await checkDuplicateInvoice(
          userId, 
          extractedData
        );
        
        if (duplicateCheck.isDuplicate) {
          duplicates.push({
            file: file.originalname, 
            invoice_number: extractedData.invoice_number,
            existing_invoice_id: duplicateCheck.existingInvoice.id
          });
          
          // Remove uploaded file since we won't use it
          await supabase.storage
            .from("invoices")
            .remove([fileName]);
            
          continue;
        }
        
        if (duplicateCheck.isPotentialDuplicate) {
          potentialDuplicates.push({
            file: file.originalname,
            invoice_number: extractedData.invoice_number,
            similar_invoices: duplicateCheck.similarInvoices.map(inv => ({
              id: inv.id,
              invoice_number: inv.invoice_number,
              invoice_date: inv.invoice_date,
              amount: inv.amount
            }))
          });
          // We still continue processing but flag it
        }

        // Prepare invoice data for Supabase
        const invoiceData = {
          user_id: userId,
          invoice_number: extractedData.invoice_number,
          invoice_date: extractedData.invoice_date,
          vendor_name: extractedData.vendor_name,
          vendor_gstin: extractedData.vendor_gstin,
          amount: extractedData.amount,
          gst_amount: extractedData.gst_amount,
          gst_rate: extractedData.gst_rate,
          type: finalInvoiceType,
          processing_status: extractedData.confidence_score > 85 ? "processed" : "pending",
          reconciliation_status: "pending",
          confidence_score: extractedData.confidence_score,
          ocr_data: extractedData.ocr_data,
          file_url: publicUrl,
        };

        // Save to Supabase
        const { data: dbData, error: dbError } = await supabase
          .from("invoices")
          .insert([invoiceData])
          .select();

        if (dbError) {
          errors.push({
            file: file.originalname,
            error: "Failed to save to database",
            details: dbError.message
          });
          console.error("Database error:", dbError);
          continue;
        }

        results.push({
          filename: file.originalname,
          invoice_id: dbData[0].id,
          type: finalInvoiceType,
          confidence_score: invoiceData.confidence_score,
          needs_review: extractedData.confidence_score <= 85,
          missing_fields: Object.entries({
            'invoice_number': !extractedData.invoice_number,
            'invoice_date': !extractedData.invoice_date,
            'vendor_name': !extractedData.vendor_name,
            'vendor_gstin': !extractedData.vendor_gstin,
            'amount': !extractedData.amount,
            'gst_amount': !extractedData.gst_amount,
            'gst_rate': !extractedData.gst_rate
          }).filter(([field, isMissing]) => isMissing)
            .map(([field]) => field)
        });
      } catch (fileError) {
        errors.push({ 
          file: file.originalname, 
          error: fileError.message,
          stack: fileError.stack
        });
        console.error(`Error processing ${file.originalname}:`, fileError);
      }
    }

    res.status(201).json({
      message: `Processed ${results.length} of ${req.files.length} invoices successfully`,
      processed: results,
      errors: errors.length > 0 ? errors : undefined,
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      potentialDuplicates: potentialDuplicates.length > 0 ? potentialDuplicates : undefined,
      success: results.length > 0,
    });
  } catch (error) {
    console.error("Error processing upload:", error);
    res.status(500).json({
      error: "Failed to process invoice upload",
      details: error.message,
      stack: error.stack,
      success: false,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "API is running" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
