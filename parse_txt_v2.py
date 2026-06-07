import re
import json
import base64

with open("/home/jambo/Umwali/amategeko/dreamz.txt", "r") as f:
    lines = f.readlines()

questions = []
current_question = None

for line in lines:
    line = line.strip()
    if not line or "RESTRICTED" in line or re.match(r'^\d+$', line): 
        continue
    
    # New question starts with "1. " or "  1. "
    q_match = re.match(r'^(\d{1,3})\.\s+(.*)', line)
    if q_match:
        if current_question:
            questions.append(current_question)
        current_question = {
            "number": int(q_match.group(1)),
            "text": q_match.group(2).strip(),
            "options": [],
            "correctKey": "a" # fallback
        }
    elif current_question:
        # Some options are weirdly formatted like "a) text   (b) text   c) text   d) text"
        # We need to split the line by option keys to be robust
        # Check if the line has a), b), c), d) or (a), (b), (c), (d)
        option_parts = re.split(r'(\(?[a-d]\)?[\.\)])\s+', line, flags=re.IGNORECASE)
        if len(option_parts) > 1:
            if option_parts[0].strip():
                if len(current_question["options"]) == 0:
                    current_question["text"] += " " + re.sub(r'\s{2,}', ' ', option_parts[0].strip())
                else:
                    current_question["options"][-1]["text"] += " " + re.sub(r'\s{2,}', ' ', option_parts[0].strip())
            
            for i in range(1, len(option_parts), 2):
                key_raw = option_parts[i].lower()
                clean_key = re.sub(r'[^a-d]', '', key_raw)
                text = ""
                if i+1 < len(option_parts):
                    text = re.sub(r'\s{2,}', ' ', option_parts[i+1].strip())
                
                # If key has (, it is correct
                if '(' in option_parts[i]:
                    current_question["correctKey"] = clean_key
                
                # Update existing if key matches, else append
                existing_opt = next((o for o in current_question["options"] if o["key"] == clean_key), None)
                if existing_opt:
                    existing_opt["text"] += " " + text
                else:
                    current_question["options"].append({"key": clean_key, "text": text})
        else:
            if len(current_question["options"]) == 0:
                current_question["text"] += " " + re.sub(r'\s{2,}', ' ', line)
            else:
                current_question["options"][-1]["text"] += " " + re.sub(r'\s{2,}', ' ', line)

if current_question:
    questions.append(current_question)

clean_questions = []
for q in questions:
    if len(q["options"]) >= 2:
        q["options"] = q["options"][:4]
        # Calculate category
        if "iki cyapa" in q["text"].lower() or "ibimenyetso" in q["text"].lower() or "ishusho" in q["text"].lower() or "iki kimenyetso" in q["text"].lower():
            q["category"] = "ibyapa"
        elif "km/h" in q["text"].lower() or "metero" in q["text"].lower() or "toni" in q["text"].lower():
            q["category"] = "numeric"
        else:
            q["category"] = "text"
            
        q["explanation"] = f"Igisubizo cy'ukuri ni {q['correctKey'].upper()} akurikijwe n'amategeko."
        clean_questions.append(q)

with open("/home/jambo/Umwali/amategeko/src/data/questions_txt.json", "w", encoding="utf-8") as f:
    json.dump(clean_questions, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(clean_questions)} clean questions!")
