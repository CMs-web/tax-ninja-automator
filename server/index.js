require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const axios = require("axios");
const FormData = require("form-data");
const { callOllamaForExtraction } = require("./callOllamaForExtraction");

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

    if (!ocrResponse.data?.ParsedResults?.[0]?.ParsedText) {
      throw new Error("Invalid OCR response format");
    }

    const rawText = ocrResponse.data.ParsedResults[0].ParsedText;

    // Ollama LLM Extraction
    let ollamaData = await callOllamaForExtraction(rawText);

    // Post-processing and corrections
    const extractedData = cleanAndCorrectExtractedData(ollamaData, rawText);

    // Initialize confidence score
    extractedData.confidence_score = 100;

    // Step 4: Retry if critical fields are missing
    const retryNeeded =
      !extractedData.amount ||
      !extractedData.gst_amount ||
      extractedData.gst_amount === 0 ||
      extractedData.gst_rate === null;

    if (retryNeeded) {
      extractedData.confidence_score = 50;
      console.warn("Retrying Ollama extraction with focused prompt...");
      const retryPrompt = `Please extract and only return the following fields from this invoice:\n\n"${rawText}"\n\nReturn a JSON with strictly:\n- amount (final total including GST)\n- gst_amount (total GST amount from CGST + SGST etc)\n- gst_rate (total %)\n\nIf missing, infer from tax lines. Format output as JSON only.`;
      const retryResponse = await axios.post(
        "http://host.docker.internal:11434/api/generate",
        {
          model: "deepseek-r1:1.5b",
          prompt: retryPrompt,
          format: "json",
          stream: false,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      try {
        const retryData = JSON.parse(retryResponse.data.response);
        extractedData.amount = retryData.amount || extractedData.amount;
        extractedData.gst_amount =
          retryData.gst_amount || extractedData.gst_amount;
        extractedData.gst_rate = retryData.gst_rate || extractedData.gst_rate;
      } catch (err) {
        console.warn("Retry JSON parse failed, using fallback data");
      }
    }

    return extractedData;
  } catch (error) {
    console.error("Error processing invoice:", error.message);
    throw new Error(`Processing failed: ${error.message}`);
  }
}

// ------------------------
// SMART POST-PROCESSING
// ------------------------

function cleanAndCorrectExtractedData(ollamaData, rawText) {
  let {
    invoice_number,
    invoice_date,
    vendor_name,
    vendor_gstin,
    amount,
    gst_amount,
    gst_rate,
    confidence_score,
  } = ollamaData;

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

  return {
    invoice_number: invoice_number || `INV-${Date.now().toString().slice(-6)}`,
    invoice_date: invoice_date || new Date().toISOString().split("T")[0],
    vendor_name: vendor_name || "Unknown Vendor",
    vendor_gstin: vendor_gstin || null,
    amount,
    gst_amount,
    gst_rate: gst_rate || null,
    ocr_data: {
      raw_text: rawText,
      extraction_time: new Date().toISOString(),
    },
    confidence_score,
  };
}

// Invoice upload endpoint
app.post(
  "/api/invoices/upload",
  upload.array("files", 10),
  async (req, res) => {
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

      // Check for duplicate invoices after extraction
      for (const file of req.files) {
        const extractedData = await extractInvoiceDataFromBuffer(
          file.buffer,
          file.mimetype
        );

        const { data: existingInvoice } = await supabase
          .from("invoices")
          .select("*")
          .eq("user_id", userId)
          .eq("invoice_number", extractedData.invoice_number)
          .eq("invoice_date", extractedData.invoice_date);

        if (existingInvoice?.length > 0) {
          errors.push({
            file: file.originalname,
            error: "Duplicate invoice (already exists)",
          });
          continue;
        }
      }

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

          // Prepare invoice data for Supabase
          const invoiceData = {
            user_id: userId,
            invoice_number: extractedData.invoice_number,
            invoice_date: extractedData.invoice_date,
            vendor_name: extractedData.vendor_name,
            vendor_gstin: extractedData.vendor_gstin,
            amount: extractedData.amount,
            gst_amount: extractedData.gst_amount,
            type: finalInvoiceType,
            processing_status: "processed",
            reconciliation_status: "pending",
            confidence_score: 100, // Ollama-based, assume high confidence
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
            });
            console.error("Database error:", dbError);
            continue;
          }

          results.push({
            filename: file.originalname,
            invoice_id: dbData[0].id,
            type: finalInvoiceType,
            confidence_score: invoiceData.confidence_score,
          });
        } catch (fileError) {
          errors.push({ file: file.originalname, error: fileError.message });
          console.error(`Error processing ${file.originalname}:`, fileError);
        }
      }

      res.status(201).json({
        message: `Processed ${results.length} of ${req.files.length} invoices successfully`,
        processed: results,
        errors: errors.length > 0 ? errors : undefined,
        success: results.length > 0,
      });
    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).json({
        error: "Failed to process invoice upload",
        details: error.message,
        success: false,
      });
    }
  }
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "API is running" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
