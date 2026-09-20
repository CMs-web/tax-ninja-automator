const axios = require("axios");

async function callOllamaForExtraction(rawText) {
  try {
    const ollamaResponse = await axios.post(
      "http://host.docker.internal:11434/api/generate",
      {
        model: "deepseek-r1:7b",

        prompt: `
You are an intelligent JSON invoice field extractor designed for Indian GST invoices.

From the following invoice text, extract these fields as structured JSON:
- invoice_number
- invoice_date
- vendor_name
- vendor_gstin
- amount (final total incl. GST)
- gst_amount (total of CGST + SGST + IGST)
- gst_rate (percentage, calculated as: (gst_amount / (amount - gst_amount)) * 100)

Instructions:
- Identify labels like "Invoice No", "Invoice Number", "GSTIN", "Total Amount", "Tax Amount", etc.
- Use text near such labels (especially right or below them) to extract the correct value
- If numeric values appear multiple times, prefer the one next to "Total", "Grand Total", or "Invoice Value"
- If invoice_number or gstin looks like "GST112020", ignore it as it's not valid
- If any field is missing, return null
- Ensure the response is always valid JSON with proper field names

Example output:
{
  "invoice_number": "21-22/G/2192",
  "invoice_date": "12-Dec-21",
  "vendor_name": "ABC Traders",
  "vendor_gstin": "23AGOPS4360D1ZE",
  "amount": 1180,
  "gst_amount": 180,
  "gst_rate": 18
}

Here is the extracted invoice text:
"""${rawText}"""
`,
        format: "json",
        stream: false,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // Parsing the Ollama response
    const ollamaData = JSON.parse(ollamaResponse.data.response);

    console.log("ollamaData", ollamaData);

    // Handling edge cases where Ollama may return unexpected results
    // if (!ollamaData || !ollamaData.invoice_number || !ollamaData.invoice_date) {
    //   console.error("Critical data missing in Ollama response:", ollamaData);
    //   throw new Error("Ollama response does not contain required fields");
    // }

    return ollamaData;
  } catch (error) {
    console.error("Error calling Ollama API:", error.message);
    throw new Error(`Ollama extraction failed: ${error.message}`);
  }
}

module.exports = { callOllamaForExtraction };
