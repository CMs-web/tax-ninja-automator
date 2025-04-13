const axios = require("axios");

async function callOllamaForExtraction(rawText) {
  try {
    const ollamaResponse = await axios.post(
      "http://host.docker.internal:11434/api/generate",
      {
        model: "deepseek-r1:1.5b",
        prompt: `You are an invoice parsing AI. Given the following invoice text, extract the following fields:

        1. invoice_number: Invoice number
        2. invoice_date: Invoice date
        3. vendor_name: Vendor or supplier name
        4. vendor_gstin: Vendor GST number (if present)
        5. amount: Final total amount (including GST)
        6. gst_amount: Total GST amount (sum of all GST components like CGST + SGST + IGST)
        7. gst_rate: Total GST rate (e.g., 18% if 9% CGST + 9% SGST)

        Rules:
        Invoice number is mandatory and it would be have different name like Invoice No, Invoice Number, Invoice ID, GSTIN/UIN, etc.
        - If only base amount and GST rate is present, calculate amount = base + gst_amount.
        - If total amount is present and GST is included, calculate gst_amount using reverse formula.
        - If GST amount and total both are given, calculate GST rate as (gst_amount / (amount - gst_amount)) * 100
        - If gst_rate is not present, calculate it from amount and gst_amount using reverse formula.
        - If any field is missing, return null.

        Return response in valid JSON format only. Do not include extra text.

        Input invoice:
        """${rawText}"""`,
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
