from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
from PIL import Image
import io
import torch

app = FastAPI()

# Allow requests from your React dev server (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*" ],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model once at startup
device = 0 if torch.cuda.is_available() else -1
pipe = pipeline(
    "image-to-text",
    model="microsoft/trocr-large-printed",
    device=device
)

@app.post("/ocr")
async def ocr_image(file: UploadFile = File(...)):
    # basic validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Not an image")

    data = await file.read()
    try:
        img = Image.open(io.BytesIO(data)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Cannot parse image")

    # inference
    result = pipe(img)[0]
    text = result.get("generated_text", "")
    return {"text": text}
