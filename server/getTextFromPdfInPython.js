const axios = require("axios");
const FormData = require("form-data");

async function getTextFromPdfInPython(buffer, filename) {
  const formData = new FormData();
  formData.append("file", buffer, filename);

  const res = await axios.post(
    "http://extractor:8000/extract-invoice",
    formData,
    {
      headers: formData.getHeaders(),
    }
  );

  if (res.data.status !== "success") {
    throw new Error("PDF extraction failed");
  }

  return res.data.raw_text;
}

module.exports = { getTextFromPdfInPython };
