import fitz
import re
import json
import base64

doc = fitz.open("/home/jambo/Downloads/dreamz.pdf")
questions = []
current_question = None

for page_num in range(len(doc)):
    page = doc[page_num]
    
    # We will use get_text("dict") to get text blocks and image blocks
    blocks = page.get_text("dict")["blocks"]
    
    # Sort blocks purely by Y coordinate from top to bottom
    sorted_blocks = sorted([b for b in blocks if "bbox" in b], key=lambda b: b["bbox"][1])
    
    for b in sorted_blocks:
        if b["type"] == 0:
            full_text = " ".join([span["text"] for line in b["lines"] for span in line["spans"]]).strip()
            if not full_text or "RESTRICTED" in full_text: continue
            
            # Start of a new question
            q_match = re.match(r'^(\d{1,3})\.\s*(.*)', full_text)
            if q_match:
                if current_question:
                    questions.append(current_question)
                
                current_question = {
                    "number": int(q_match.group(1)),
                    "text": q_match.group(2),
                    "options": [],
                    "image": None,
                    "bbox": b["bbox"]
                }
            elif current_question:
                # Naive option extraction
                opts_found = re.findall(r'\(?([a-d])\)[ \.]\s*([^a-d]*?)(?=\(?[a-d]\)[ \.]|$)', full_text, flags=re.IGNORECASE)
                if opts_found:
                    for k, t in opts_found:
                        if t.strip():
                            current_question["options"].append({"key": k.lower(), "text": t.strip()})
                elif not current_question["options"]:
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

clean_questions = []
for q in questions:
    if "iki cyapa" in q["text"].lower() or "ibimenyetso" in q["text"].lower() or "ishusho" in q["text"].lower():
        q["category"] = "ibyapa"
    else:
        q["category"] = "text"
    
    if len(q["options"]) >= 2:
        clean_questions.append(q)

with open("/home/jambo/Umwali/amategeko/src/data/questions_full.json", "w", encoding="utf-8") as f:
    json.dump(clean_questions, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(clean_questions)} questions with explicit layout parsing!")
