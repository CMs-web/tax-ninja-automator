
# GST Filing App Backend

This is the backend server for the GST Filing application. It handles file uploads, OCR processing using Tesseract.js, and storing invoice data in Supabase.

## Features

- Express.js backend with RESTful API
- File upload handling with Multer
- OCR processing with Tesseract.js
- Integration with Supabase for storage and database

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

3. Edit the `.env` file and add your Supabase service key:
   ```
   PORT=5000
   SUPABASE_SERVICE_KEY=your-supabase-service-key-here
   ```

4. Start the server:
   ```
   npm start
   ```

   For development with auto-restart:
   ```
   npm run dev
   ```

## API Endpoints

### Upload Invoice
- **URL**: `/api/invoices/upload`
- **Method**: POST
- **Body**: Form-data with file, userId, and invoiceType
- **Response**: JSON with the processed invoice data

### Health Check
- **URL**: `/api/health`
- **Method**: GET
- **Response**: JSON with status message

## Notes

- The OCR extraction logic can be enhanced based on your invoice formats.
- Make sure your Supabase service key has the necessary permissions for storage and database operations.
