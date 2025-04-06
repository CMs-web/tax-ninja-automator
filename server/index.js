
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase client setup
const supabaseUrl = "https://sjqezbfqmwfwbutgzwqd.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// OCR Space API Key
const OCR_SPACE_API_KEY = process.env.OCR_SPACE_API_KEY || '';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Vite's default dev server port
  credentials: true
}));
app.use(express.json());

// Configure multer for memory storage (without saving to disk)
const memoryStorage = multer.memoryStorage();
const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only PDF, JPEG, PNG, and WebP files are allowed!'));
    }
    cb(null, true);
  }
});

// Helper function to find the most relevant value from OCR lines based on proximity
function findValueByLabel(ocrLines, labelText, isAmount = false) {
  // Find the line containing the label
  const labelLine = ocrLines.find(line => 
    line.LineText.toLowerCase().includes(labelText.toLowerCase())
  );
  
  if (!labelLine) return null;
  
  // Find values near the label based on MinTop position
  const nearbyLines = ocrLines.filter(line => 
    Math.abs(line.MinTop - labelLine.MinTop) < 50 && // Within 50px vertically
    !line.LineText.toLowerCase().includes(labelText.toLowerCase()) && // Not the label itself
    (isAmount ? /^[\d,.]+$/.test(line.LineText.trim()) : true) // If looking for amount, ensure it looks like a number
  );
  
  // Sort by vertical proximity and return the closest value
  if (nearbyLines.length > 0) {
    nearbyLines.sort((a, b) => Math.abs(a.MinTop - labelLine.MinTop) - Math.abs(b.MinTop - labelLine.MinTop));
    const value = nearbyLines[0].LineText.trim();
    return isAmount ? parseFloat(value.replace(/,/g, '')) : value;
  }
  
  return null;
}

// Helper function to extract invoice details using OCR.space API
async function extractInvoiceDataFromBuffer(buffer, mimeType) {
  console.log('Extracting text from file using OCR.space...');
  
  // Prepare form data for OCR.space API
  const formData = new FormData();
  formData.append('apikey', OCR_SPACE_API_KEY);
  formData.append('language', 'eng');
  formData.append('isTable', 'true');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2'); // More accurate engine
  formData.append('file', buffer, {
    filename: 'invoice.pdf',
    contentType: mimeType
  });
  
  try {
    // Call OCR.space API
    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: {
        ...formData.getHeaders(),
      }
    });
    
    console.log('OCR.space API response received');
    
    if (!response.data?.ParsedResults?.[0]?.TextOverlay?.Lines) {
      throw new Error('Invalid OCR response format');
    }
    
    const ocrLines = response.data.ParsedResults[0].TextOverlay.Lines;
    const rawText = response.data.ParsedResults[0].ParsedText;
    
    console.log('Extracted OCR lines:', ocrLines.length);
    
    // Extract invoice data by looking for specific labels and their nearby values
    // Invoice Number
    const invoiceNumber = findValueByLabel(ocrLines, 'invoice no') || 
                          findValueByLabel(ocrLines, 'invoice number') ||
                          findValueByLabel(ocrLines, 'bill no') ||
                          `INV-${Date.now().toString().slice(-6)}`;
    
    // Invoice Date
    const dateMatch = findValueByLabel(ocrLines, 'date') || 
                      findValueByLabel(ocrLines, 'invoice date');
    
    let invoiceDate;
    if (dateMatch) {
      // Try to parse various date formats
      try {
        invoiceDate = new Date(dateMatch).toISOString().split('T')[0];
        // Check if valid date
        if (invoiceDate === 'Invalid Date' || invoiceDate === null) {
          invoiceDate = new Date().toISOString().split('T')[0];
        }
      } catch {
        invoiceDate = new Date().toISOString().split('T')[0];
      }
    } else {
      invoiceDate = new Date().toISOString().split('T')[0];
    }
    
    // Vendor Name
    const vendorName = findValueByLabel(ocrLines, 'seller') ||
                       findValueByLabel(ocrLines, 'vendor') ||
                       findValueByLabel(ocrLines, 'from') ||
                       findValueByLabel(ocrLines, 'supplier') ||
                       "Unknown Vendor";
    
    // Vendor GSTIN
    const vendorGstin = findValueByLabel(ocrLines, 'gstin') || 
                        findValueByLabel(ocrLines, 'gst no') ||
                        null;
    
    // Amount (looking for "total", "amount", "grand total", etc.)
    let amount = findValueByLabel(ocrLines, 'total amount after tax', true) ||
                 findValueByLabel(ocrLines, 'grand total', true) ||
                 findValueByLabel(ocrLines, 'total amount', true) ||
                 findValueByLabel(ocrLines, 'amount', true) ||
                 0;
    
    // GST Amount 
    let gstAmount = findValueByLabel(ocrLines, 'total tax', true) ||
                    findValueByLabel(ocrLines, 'igst', true) ||
                    findValueByLabel(ocrLines, 'sgst', true) ||
                    findValueByLabel(ocrLines, 'cgst', true) ||
                    findValueByLabel(ocrLines, 'gst', true) ||
                    0;
    
    if (gstAmount === 0 && amount > 0) {
      // Estimate GST as roughly 18% of the total amount
      gstAmount = Math.round(amount * 0.15);
    }
    
    // GST Rate (percentage)
    let gstRate = null;
    
    // Look for GST rate patterns like "18%" or "18 %"
    const gstRateRegex = /(\d+)\s*%/;
    for (const line of ocrLines) {
      if (line.LineText.toLowerCase().includes('gst') || 
          line.LineText.toLowerCase().includes('tax')) {
        const match = line.LineText.match(gstRateRegex);
        if (match) {
          gstRate = parseInt(match[1]);
          break;
        }
      }
    }
    
    // If GST rate not found but we have amount and GST amount, estimate it
    if (gstRate === null && amount > 0 && gstAmount > 0) {
      // Estimate GST rate based on the ratio
      const baseAmount = amount - gstAmount;
      if (baseAmount > 0) {
        gstRate = Math.round((gstAmount / baseAmount) * 100);
      }
    }
    
    // Calculate confidence score based on how many fields were extracted
    const extractedFields = [
      invoiceNumber !== `INV-${Date.now().toString().slice(-6)}`, // Not default
      dateMatch !== null,
      vendorName !== "Unknown Vendor", // Not default
      vendorGstin !== null,
      amount > 0,
      gstAmount > 0,
      gstRate !== null
    ];
    
    const confidenceScore = (extractedFields.filter(Boolean).length / extractedFields.length) * 100;
    
    // Create OCR data object to store all extracted information
    const ocrData = {
      raw_text: rawText,
      extraction_time: new Date().toISOString(),
      identified_fields: extractedFields.filter(Boolean).length,
      total_possible_fields: extractedFields.length,
      parsed_lines: ocrLines
    };
    
    return {
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      vendor_name: vendorName,
      vendor_gstin: vendorGstin,
      amount: amount,
      gst_amount: gstAmount,
      gst_rate: gstRate,
      confidence_score: confidenceScore,
      ocr_data: ocrData
    };
  } catch (error) {
    console.error('Error calling OCR.space API:', error);
    throw new Error(`OCR processing failed: ${error.message}`);
  }
}

// Unified invoice upload endpoint that handles both single and batch uploads
app.post('/api/invoices/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'No files uploaded',
        success: false
      });
    }

    const { userId, invoiceType } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required',
        success: false
      });
    }
    
    const isBatchUpload = req.files.length > 1;
    console.log(`Processing ${req.files.length} file(s) for user ${userId}...`);
    
    // Process each file
    const results = [];
    const errors = [];
    
    for (const file of req.files) {
      try {
        console.log(`Processing file: ${file.originalname}`);
        
        // Upload file to Supabase Storage
        const fileExt = file.originalname.substring(file.originalname.lastIndexOf('.'));
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 10)}${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });
        
        if (uploadError) {
          errors.push({ file: file.originalname, error: 'Failed to upload to storage' });
          console.error('Error uploading to Supabase Storage:', uploadError);
          continue;
        }
        
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('invoices')
          .getPublicUrl(fileName);
        
        // Extract invoice data using OCR.space
        const extractedData = await extractInvoiceDataFromBuffer(file.buffer, file.mimetype);
        
        // Determine invoice type based on provided type or keywords
        let finalInvoiceType = invoiceType || 'unknown';
        
        // If no invoice type was explicitly provided, try to infer it from text content
        if (!invoiceType && finalInvoiceType === 'unknown') {
          const salesKeywords = ['sales', 'invoice', 'bill to', 'customer', 'sold to'];
          const purchaseKeywords = ['purchase', 'vendor', 'supplier', 'bill from', 'bought from'];
          
          const lowerText = extractedData.ocr_data.raw_text.toLowerCase();
          
          if (salesKeywords.some(keyword => lowerText.includes(keyword))) {
            finalInvoiceType = 'sales';
          } else if (purchaseKeywords.some(keyword => lowerText.includes(keyword))) {
            finalInvoiceType = 'purchase';
          }
        }
        
        // Create invoice record
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
          processing_status: 'pending',
          reconciliation_status: 'pending',
          confidence_score: extractedData.confidence_score,
          ocr_data: extractedData.ocr_data,
          file_url: publicUrl
        };
        
        const { data: dbData, error: dbError } = await supabase
          .from('invoices')
          .insert([invoiceData])
          .select();
        
        if (dbError) {
          errors.push({ file: file.originalname, error: 'Failed to save to database' });
          console.error('Error storing invoice in database:', dbError);
          continue;
        }
        
        results.push({
          filename: file.originalname,
          invoice_id: dbData[0].id,
          type: finalInvoiceType,
          confidence_score: extractedData.confidence_score
        });
        
      } catch (fileError) {
        errors.push({ file: file.originalname, error: fileError.message });
        console.error(`Error processing file ${file.originalname}:`, fileError);
      }
    }
    
    // Respond based on single vs batch upload
    if (isBatchUpload) {
      res.status(201).json({
        message: `Processed ${results.length} of ${req.files.length} invoices successfully`,
        processed: results,
        errors: errors.length > 0 ? errors : undefined,
        success: results.length > 0
      });
    } else {
      // Single file upload response
      if (results.length > 0) {
        res.status(201).json({
          message: 'Invoice uploaded and processed successfully',
          invoice: results[0],
          success: true
        });
      } else {
        // All single files failed
        res.status(500).json({ 
          error: 'Failed to process invoice', 
          details: errors[0]?.error || 'Unknown error',
          success: false
        });
      }
    }
    
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ 
      error: 'Failed to process invoice upload', 
      details: error.message,
      success: false
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
