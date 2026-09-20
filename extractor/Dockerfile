FROM python:3.10-slim

WORKDIR /app
COPY . .

# 👇 Install required Python packages
RUN pip install fastapi uvicorn pdfplumber python-multipart

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
