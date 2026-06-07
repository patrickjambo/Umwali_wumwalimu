import fitz
import re
import json
import base64

doc = fitz.open("/home/jambo/Downloads/dreamz.pdf")
questions = []
current_question = None

for page_num in range(len(doc)):
    page = doc[page_num]
    blocks = page.get_text("dict")["blocks"]

    # Sometimes PDF options are on the same line horizontally. Let's do raw text extraction for questions, and bounding boxes for images.
    text_blocks = [b for b in blocks if b["type"] == 0]
    img_blocks = [b for b in blocks if b["type"] == 1]
    
    # Sort vertically
    text_blocks.sort(key=lambda b: b["bbox"][1])
    
    for b in text_blocks:
        lines = []
        for line in b["lines"]:
            span_text = " ".join([s["text"] for s in line["spans"]])
            lines.append(span_text.strip())
            
        full_text = " ".join(lines).strip()
        if not full_text: continue
        
        # Split block if it contains multiple logical lines (like multiple options on same line)
        # Using a regex to find all a), b), c), d) occurrences
        split_text = re.split(r'(\(?[a-d]\)[ \.])', full_text, flags=re.IGNORECASE)
        
        if re.match(r'^(\d{1,3})\.\s*(.*)', full_text):
            q_match = re.match(r'^(\d{1,3})\.\s*(.*)', full_text)
            if current_question:
                questions.append(current_question)
            
            q_num = int(q_match.group(1))
            q_text = q_match.group(2)
            current_question = {
                "number": q_num,
                "text": q_text,
                "options": [],
                "image": None,
                "bbox": b["bbox"]
            }
        else:
            if current_question:
                # Naive parse for options
                opts_found = re.findall(r'\(?([a-d])\)[ \.]\s*([^a-d]*?)(?=\(?[a-d]\)[ \.]|$)', full_text, flags=re.IGNORECASE)
                if opts_found:
                    for k, t in opts_found:
                        current_question["options"].append({"key": k.lower(), "text": t.strip()})
                elif len(current_question["options"]) == 0:
                    current_question["text"] += " " + full_text
                elif len(current_question["options"]) > 0:
                    current_question["options"][-1]["text"] += " " + full_text

    # Match images on this page to the nearest question above it
    for img in img_blocks:
        img_y = img["bbox"][1]
        
        # Find the question closest to img_y but above it
        closest_q = None
        min_dist = float('inf')
        
        # Only check questions found on the CURRENT page
        # To do this safely, we match the currently parsing questions
        for q in questions[-5:] + ([current_question] if current_question else []):
            if q is None: continue
            dist = img_y - q["bbox"][3] # distance from bottom of question text to top of image
            if dist > -50 and dist < min_dist: # allow slight overlap
                min_dist = dist
                closest_q = q
                
        if closest_q:
            img_bytes = img["image"]
            img_b64 = base64.b64encode(img_bytes).decode('utf-8')
            closest_q["image"] = f"data:image/{img['ext']};base64,{img_b64}"

if current_question:
    questions.append(current_question)

clean_questions = [q for q in questions if len(q["options"]) >= 2]

with open("/home/jambo/Umwali/amategeko/src/data/questions_with_images.json", "w", encoding="utf-8") as f:
    json.dump(clean_questions, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(clean_questions)} questions with inline images!")
