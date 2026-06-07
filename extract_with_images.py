import fitz
import re
import json
import base64

doc = fitz.open("/home/jambo/Downloads/dreamz.pdf")
questions = []
current_question = None

# We will read blocks sequentially per page and sort by Y coordinate
for page_num in range(len(doc)):
    page = doc[page_num]
    blocks = page.get_text("dict")["blocks"]

    # Sort blocks by Y coordinate (bbox[1])
    sorted_blocks = sorted([b for b in blocks if "bbox" in b], key=lambda b: b["bbox"][1])
    
    for b in sorted_blocks:
        if b["type"] == 0:
            full_text = " ".join([span["text"] for line in b["lines"] for span in line["spans"]]).strip()
            if not full_text: continue
            
            # Detect question start e.g. "241. Iki cyapa..."
            q_match = re.match(r'^(\d{1,3})\.\s*(.*)', full_text)
            if q_match:
                # Save previous question
                if current_question:
                    questions.append(current_question)
                
                q_num = int(q_match.group(1))
                q_text = q_match.group(2)
                current_question = {
                    "number": q_num,
                    "text": q_text,
                    "options": [],
                    "image": None,
                    "y_coord": b["bbox"][1]
                }
            elif current_question:
                # check for options if it starts with a), b), (a), etc
                opt_match = re.match(r'^\(?([a-d])\)?[\.\s]\s*(.*)', full_text, flags=re.IGNORECASE)
                if opt_match:
                    current_question["options"].append({
                        "key": opt_match.group(1).lower(),
                        "text": opt_match.group(2)
                    })
                elif len(current_question["options"]) == 0:
                    current_question["text"] += " " + full_text
                else:
                    # append to last option
                    current_question["options"][-1]["text"] += " " + full_text
        elif b["type"] == 1 and current_question:
            # It's an image. Link it if it's below the text of the current question.
            if b["bbox"][1] >= current_question["y_coord"]:
                img_bytes = b["image"]
                img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                current_question["image"] = f"data:image/{b['ext']};base64,{img_b64}"

if current_question:
    questions.append(current_question)

# Filter out bad parses
clean_questions = [q for q in questions if len(q["options"]) >= 2]

with open("/home/jambo/Umwali/amategeko/src/data/questions_with_images.json", "w", encoding="utf-8") as f:
    json.dump(clean_questions, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(clean_questions)} questions with inline images!")
