
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { createWorker } = require('tesseract.js');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase client setup
const supabaseUrl = "https://sjqezbfqmwfwbutgzwqd.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Helper function to extract invoice details using Tesseract.js
async function extractInvoiceDataFromBuffer(buffer, mimeType) {
  console.log('Extracting text from file buffer...');
  const worker = await createWorker();
  
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  
  const { data: { text } } = await worker.recognize(buffer);
  await worker.terminate();
  
  console.log('Extracted text:', text);
  
  // Enhanced extraction logic for improved invoice data extraction
  const invoiceNumberPattern = /invoice[:\s]*#?\s*([A-Za-z0-9\-\/]+)/i;
  const datePattern = /date[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i;
  const amountPattern = /(?:total|amount|sum)[:\s]*(?:Rs\.?|₹|INR)?\s*([0-9,]+\.[0-9]{2})/i;
  const gstPattern = /(?:gst|cgst|sgst|igst)[:\s]*(?:Rs\.?|₹|INR)?\s*([0-9,]+\.[0-9]{2})/i;
  const gstRatePattern = /(?:gst|tax)[:\s]*(?:rate|percentage)[:\s]*([0-9]{1,2})%/i;
  const vendorNamePattern = /(?:vendor|from|seller|company)[:\s]*([A-Za-z0-9\s]+)(?:Ltd\.?|Inc\.?|Pvt\.?)?/i;
  const vendorGstinPattern = /(?:gstin|gst\s+no)[:\s]*([0-9A-Z]{15})/i;
  
  // Extract data using regex patterns
  const invoiceNumber = text.match(invoiceNumberPattern)?.[1] || `INV-${Date.now().toString().slice(-6)}`;
  const dateMatch = text.match(datePattern)?.[1];
  let invoiceDate = dateMatch ? new Date(dateMatch).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const vendorName = text.match(vendorNamePattern)?.[1]?.trim() || "Unknown Vendor";
  const vendorGstin = text.match(vendorGstinPattern)?.[1] || null;
  
  // Parse amount, GST rate and GST amount, removing commas and converting to numbers
  let amount = 0;
  let gstAmount = 0;
  let gstRate = null;
  
  const amountMatch = text.match(amountPattern)?.[1];
  if (amountMatch) {
    amount = parseFloat(amountMatch.replace(/,/g, ''));
  }
  
  const gstMatch = text.match(gstPattern)?.[1];
  if (gstMatch) {
    gstAmount = parseFloat(gstMatch.replace(/,/g, ''));
  } else {
    // If GST is not explicitly found, estimate it as 18% of the amount
    gstAmount = amount * 0.18;
  }
  
  const gstRateMatch = text.match(gstRatePattern)?.[1];
  if (gstRateMatch) {
    gstRate = parseFloat(gstRateMatch);
  } else if (amount > 0 && gstAmount > 0) {
    // Estimate GST rate based on the ratio of GST amount to base amount
    gstRate = Math.round((gstAmount / (amount - gstAmount)) * 100);
  }
  
  // Calculate confidence score based on how many fields were extracted
  const extractedFields = [
    invoiceNumber !== `INV-${Date.now().toString().slice(-6)}`, // Not default
    dateMatch !== null,
    vendorName !== "Unknown Vendor", // Not default
    vendorGstin !== null,
    amountMatch !== null,
    gstMatch !== null,
    gstRateMatch !== null
  ];
  
  const confidenceScore = (extractedFields.filter(Boolean).length / extractedFields.length) * 100;
  
  // Create OCR data object to store all extracted information
  const ocrData = {
    raw_text: text,
    extraction_time: new Date().toISOString(),
    identified_fields: extractedFields.filter(Boolean).length,
    total_possible_fields: extractedFields.length
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
}

// Upload invoice file and extract data
app.post('/api/invoices/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { userId, invoiceType } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    if (!invoiceType || !['sales', 'purchase'].includes(invoiceType)) {
      return res.status(400).json({ error: 'Valid invoice type (sales/purchase) is required' });
    }
    
    // Extract invoice data using Tesseract.js directly from buffer
    console.log('Processing file from memory...');
    const extractedData = await extractInvoiceDataFromBuffer(req.file.buffer, req.file.mimetype);
    
    console.log('Extracted data:', extractedData);
    
    // Upload file directly to Supabase Storage using the service role key
    const fileExt = req.file.originalname.substring(req.file.originalname.lastIndexOf('.'));
    const fileName = `${userId}/${Date.now()}${fileExt}`;
    
    console.log(`Uploading file to storage path: ${fileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to storage', details: uploadError });
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(fileName);
    
    // Insert invoice data into Supabase database
    const invoiceData = {
      user_id: userId,
      invoice_number: extractedData.invoice_number,
      invoice_date: extractedData.invoice_date,
      vendor_name: extractedData.vendor_name,
      vendor_gstin: extractedData.vendor_gstin,
      amount: extractedData.amount,
      gst_amount: extractedData.gst_amount,
      gst_rate: extractedData.gst_rate,
      type: invoiceType,
      processing_status: 'pending',
      reconciliation_status: 'pending',
      confidence_score: extractedData.confidence_score,
      ocr_data: extractedData.ocr_data,
      file_url: publicUrl
    };
    
    // Using service role key allows us to bypass RLS
    const { data: dbData, error: dbError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select();
    
    if (dbError) {
      console.error('Error storing invoice in database:', dbError);
      return res.status(500).json({ error: 'Failed to save invoice data', details: dbError });
    }
    
    res.status(201).json({
      message: 'Invoice uploaded and processed successfully',
      invoice: dbData[0]
    });
    
  } catch (error) {
    console.error('Error processing invoice:', error);
    res.status(500).json({ error: 'Failed to process invoice', details: error.message });
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
