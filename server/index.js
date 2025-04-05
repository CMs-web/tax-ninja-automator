
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
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
async function extractInvoiceData(filePath) {
  const worker = await createWorker();
  
  await worker.loadLanguage('eng');
  await worker.initialize('eng');
  
  const { data: { text } } = await worker.recognize(filePath);
  await worker.terminate();
  
  console.log('Extracted text:', text);
  
  // Simple extraction logic (can be improved based on your invoice format)
  const invoiceNumberPattern = /invoice[:\s]*#?\s*([A-Za-z0-9\-]+)/i;
  const datePattern = /date[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i;
  const amountPattern = /(?:total|amount|sum)[:\s]*(?:Rs\.?|₹|INR)?\s*([0-9,]+\.[0-9]{2})/i;
  const gstPattern = /(?:gst|cgst|sgst|igst)[:\s]*(?:Rs\.?|₹|INR)?\s*([0-9,]+\.[0-9]{2})/i;
  const vendorPattern = /(?:vendor|from|seller|company)[:\s]*([A-Za-z0-9\s]+)(?:Ltd\.?|Inc\.?|Pvt\.?)?/i;
  
  // Extract data using regex patterns
  const invoiceNumber = text.match(invoiceNumberPattern)?.[1] || `INV-${Date.now().toString().slice(-6)}`;
  const dateMatch = text.match(datePattern)?.[1];
  let invoiceDate = dateMatch ? new Date(dateMatch).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
  const vendor = text.match(vendorPattern)?.[1]?.trim() || "Unknown Vendor";
  
  // Parse amount and GST, removing commas and converting to numbers
  let amount = 0;
  let gstAmount = 0;
  
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
  
  return {
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    vendor: vendor,
    amount: amount,
    gst_amount: gstAmount
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
    
    const filePath = req.file.path;
    
    // Extract invoice data using Tesseract.js
    console.log('Extracting data from file:', filePath);
    const extractedData = await extractInvoiceData(filePath);
    
    console.log('Extracted data:', extractedData);
    
    // Upload file to Supabase Storage
    const fileBuffer = fs.readFileSync(filePath);
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${userId}/${Date.now()}${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(fileName, fileBuffer, {
        contentType: req.file.mimetype,
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      return res.status(500).json({ error: 'Failed to upload file to storage' });
    }
    
    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(uploadData.path);
    
    // Insert invoice data into Supabase database
    const invoiceData = {
      user_id: userId,
      invoice_number: extractedData.invoice_number,
      invoice_date: extractedData.invoice_date,
      vendor: extractedData.vendor,
      amount: extractedData.amount,
      gst_amount: extractedData.gst_amount,
      type: invoiceType,
      status: 'pending',
      file_url: publicUrl
    };
    
    const { data: dbData, error: dbError } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select();
    
    if (dbError) {
      console.error('Error storing invoice in database:', dbError);
      return res.status(500).json({ error: 'Failed to save invoice data' });
    }
    
    // Clean up the local file
    fs.unlinkSync(filePath);
    
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
