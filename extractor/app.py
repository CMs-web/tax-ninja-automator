# extractor/main.py

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import pdfplumber

app = FastAPI()

@app.post("/extract-invoice")
async def extract_invoice(file: UploadFile = File(...)):
    try:
        full_text = ""
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

        return JSONResponse(content={"status": "success", "raw_text": full_text.strip()})
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})
