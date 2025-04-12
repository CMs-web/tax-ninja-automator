
const axios = require("axios");

async function callOllamaForExtraction(rawText) {
  try {
    const prompt = `You are an expert invoice data extraction AI. Given the following invoice text, extract these fields with high accuracy:

1. invoice_number: Invoice number (look for patterns like "Invoice No:", "Bill No:", etc.)
2. invoice_date: Invoice date in YYYY-MM-DD format
3. vendor_name: Company name that issued the invoice
4. vendor_gstin: GSTIN number (format: 2 digits, 5 letters, 4 digits, 1 letter, 1 digit or letter, Z, 1 digit or letter)
5. amount: Total amount INCLUDING GST
6. gst_amount: Total GST amount (sum of CGST + SGST + IGST components)
7. gst_rate: GST percentage rate (e.g. 18 for 18%)

Important rules:
- Use numerical values only for amount and gst_amount (e.g. 1000.50, not "₹1,000.50")
- For invoice_number, include both letters and numbers exactly as shown
- For dates, convert to YYYY-MM-DD format
- If a field is not found, return null for that field
- GST rate should be a number (e.g. 18, not "18%")
- If only base amount and GST rate are present, calculate total amount and GST amount
- If only total amount and GST rate are present, calculate GST amount using: amount - (amount ÷ (1 + gst_rate/100))

Invoice text:
"""${rawText}"""

Return a valid JSON object with ONLY these fields.`;

    const ollamaResponse = await axios.post(
      "http://host.docker.internal:11434/api/generate",
      {
        model: "deepseek-r1:1.5b",
        prompt: prompt,
        format: "json",
        stream: false,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    // Safely parse the Ollama response
    try {
      const jsonResponse = JSON.parse(ollamaResponse.data.response);
      console.log("Ollama extraction successful:", jsonResponse);
      return jsonResponse;
    } catch (parseError) {
      console.error("Failed to parse Ollama JSON response:", parseError);
      console.log("Raw response:", ollamaResponse.data.response);
      
      // Try extracting JSON from the text (sometimes Ollama adds extra text)
      const jsonMatch = ollamaResponse.data.response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const extractedJson = JSON.parse(jsonMatch[0]);
          console.log("Extracted JSON from response:", extractedJson);
          return extractedJson;
        } catch (e) {
          console.error("Failed to extract JSON from response");
        }
      }
      
      // Return a minimal object if extraction fails
      return {
        invoice_number: null,
        invoice_date: null,
        vendor_name: null,
        vendor_gstin: null,
        amount: null,
        gst_amount: null,
        gst_rate: null
      };
    }
  } catch (error) {
    console.error("Error calling Ollama API:", error.message);
    throw new Error(`Ollama extraction failed: ${error.message}`);
  }
}

module.exports = { callOllamaForExtraction };
