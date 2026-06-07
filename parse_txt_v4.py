import re
import json

with open("/home/jambo/Umwali/amategeko/dreamz.txt", "r") as f:
    lines = f.readlines()

questions = []
current_question = None

for i, line in enumerate(lines):
    line = line.strip()
    # Skip noise
    if not line or "RESTRICTED" in line or re.match(r'^\d+$', line): 
        continue
    
    q_match = re.match(r'^(\d{1,3})\.\s*(.*)', line)
    if q_match:
        if current_question:
            questions.append(current_question)
        current_question = {
            "number": int(q_match.group(1)),
            "text": q_match.group(2).strip(),
            "options": [],
            "correctKey": "a"
        }
    elif current_question:
        # Check if line contains a question option using aggressive matching. 
        # Needs to handle a) or (a) at start of line or with space
        opt_match = re.match(r'^\(?([a-d])\)?[\.\)]\s*(.*)', line, flags=re.IGNORECASE)
        
        if opt_match:
            key = opt_match.group(1).lower()
            text = opt_match.group(2).strip()
            
            if '(' in line.split()[0]: # The parenthesis marks the correct key
                current_question["correctKey"] = key
                
            current_question["options"].append({"key": key, "text": text})
        else:
            if not current_question["options"]:
                # Continuation of question text
                current_question["text"] += " " + re.sub(r'\s{2,}', ' ', line)
            else:
                # Continuation of option text
                current_question["options"][-1]["text"] += " " + re.sub(r'\s{2,}', ' ', line)

if current_question:
    questions.append(current_question)

print(f"Total parsed: {len(questions)}")
clean = [q for q in questions if len(q["options"]) >= 2]
print(f"Total clean: {len(clean)}")

# Map old images
try:
    with open("/home/jambo/Umwali/amategeko/src/data/questions.json", "r") as f:
        old_q = json.load(f)
    img_map = {q["number"]: q.get("image") for q in old_q if q.get("image")}
except:
    img_map = {}

for q in clean:
    if len(q["options"]) >= 2:
        q["options"] = q["options"][:4]
    
    # Check category
    if "iki cyapa" in q["text"].lower() or "ibimenyetso" in q["text"].lower() or "icyapa" in q["text"].lower():
        q["category"] = "ibyapa"
    elif "km/h" in q["text"].lower() or "metero" in q["text"].lower() or "santimetero" in q["text"].lower():
        q["category"] = "numeric"
    else:
        q["category"] = "text"
        
    q["explanation"] = f"Igisubizo cy'ukuri ni {q['correctKey'].upper()} akurikijwe n'amategeko."
    
    if q["number"] in img_map:
        q["image"] = img_map[q["number"]]

with open("/home/jambo/Umwali/amategeko/src/data/questions_grouped.json", "w", encoding="utf-8") as f:
   json.dump(clean, f, ensure_ascii=False, indent=2)

