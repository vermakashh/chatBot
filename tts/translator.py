import sys
import os
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

# Add base path to PYTHONPATH
toolkit_path = os.path.abspath("IndicTransToolkit")
if toolkit_path not in sys.path:
    sys.path.insert(0, toolkit_path)

from IndicTransToolkit.processor import IndicProcessor

# Setup
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
src_lang, tgt_lang = "eng_Latn", "hin_Deva"
model_name = "ai4bharat/indictrans2-en-indic-1B"

# Load model/tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModelForSeq2SeqLM.from_pretrained(
    model_name,
    trust_remote_code=True,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    attn_implementation="flash_attention_2" if torch.cuda.is_available() else None
).to(DEVICE)

ip = IndicProcessor(inference=True)

def translate_to_hindi_devnagri(text: str) -> str:
    batch = ip.preprocess_batch([text], src_lang=src_lang, tgt_lang=tgt_lang)
    inputs = tokenizer(batch, truncation=True, padding="longest", return_tensors="pt").to(DEVICE)
    with torch.no_grad():
        output = model.generate(
            inputs["input_ids"],
            attention_mask=inputs["attention_mask"],
            max_length=256,
            num_beams=5
        )
    decoded = tokenizer.batch_decode(output, skip_special_tokens=True)
    return ip.postprocess_batch(decoded, lang=tgt_lang)[0]
