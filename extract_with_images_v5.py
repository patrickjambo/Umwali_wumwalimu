import fitz
import re
import json
import base64

doc = fitz.open("/home/jambo/Downloads/dreamz.pdf")
questions = []
current_question = None

for page_num in range(len(doc)):
    page = doc[page_num]
    
    # Simple extraction block
    blocks = page.get_text("dict")["blocks"]
    
    # Sort blocks purely by Y coordinate from top to bottom
    sorted_blocks = sorted([b for b in blocks if "bbox" in b], key=lambda b: b["bbox"][1])
    
    for b in sorted_blocks:
        if b["type"] == 0:
            full_text = " ".join([span["text"] for line in b["lines"] for span in line["spans"]]).strip()
            if not full_text or "RESTRICTED" in full_text: continue
            
            # Use same regex that successfully found 280 last time
            q_match = re.match(r'^(\d{1,3})\.\s*(.*)', full_text)
            if q_match:
                if current_question:
                    questions.append(current_question)
                
                current_question = {
                    "number": int(q_match.group(1)),
                    "text": q_match.group(2),
                    "options": [],
                    "image": None
                }
            elif current_question:
                # Try to split by a) b) c) d)
                opts_parts = re.split(r'(?:^|\s)\(?([a-d])\)[ \.]\s*', full_text, flags=re.IGNORECASE)
                if len(opts_parts) > 1:
                    if opts_parts[0].strip() and not current_question["options"]:
                        current_question["text"] += " " + opts_parts[0].strip()
                        
                    for i in range(1, len(opts_parts), 2):
                        if i+1 < len(opts_parts):
                            k = opts_parts[i].lower()
                            t = opts_parts[i+1].strip()
                            current_question["options"].append({"key": k, "text": t})
                else:
                    if not current_question["options"]:
                        current_question["text"] += " " + full_text
                    else:
                        current_question["options"][-1]["text"] += " " + full_text
        elif b["type"] == 1 and current_question:
            # It's an image block that comes right after/during the question
            img_bytes = b["image"]
            img_b64 = base64.b64encode(img_bytes).decode('utf-8')
            if not current_question["image"]:
                current_question["image"] = f"data:image/{b['ext']};base64,{img_b64}"

if current_question:
    questions.append(current_question)

# Let's retain ALL questions (merge with old questions.json correctKeys if possible)
clean_questions = []
old_questions_path = "/home/jambo/Umwali/amategeko/src/data/questions.json"
old_mapped = {}
try:
    with open(old_questions_path, "r") as f:
         old_data = json.load(f)
         for oq in old_data:
             old_mapped[oq["number"]] = oq
except:
    pass

for q in questions:
    old_q = old_mapped.get(q["number"])
    
    if "iki cyapa" in q["text"].lower() or "ibimenyetso" in q["text"].lower() or "ishusho" in q["text"].lower() or "iki cyapa gisobanura" in q["text"].lower():
        q["category"] = "ibyapa"
    else:
        q["category"] = "text"
        
    q["correctKey"] = old_q["correctKey"] if old_q and "correctKey" in old_q else "a"
    q["explanation"] = old_q["explanation"] if old_q and "explanation" in old_q else "Igisubizo ni " + q["correctKey"].upper()
    
    # Fallback to old options if V5 options failed to parse well
    if len(q["options"]) < 2 and old_q and len(old_q["options"]) >= 2:
        q["options"] = old_q["options"]
        q["text"] = old_q["text"]
    
    if len(q["options"]) >= 2:
        q["options"] = q["options"][:4]
        clean_questions.append(q)

with open("/home/jambo/Umwali/amategeko/src/data/questions.json", "w", encoding="utf-8") as f:
    json.dump(clean_questions, f, ensure_ascii=False, indent=2)

print(f"Merged and extracted {len(clean_questions)} questions with explicit layout parsing!")
