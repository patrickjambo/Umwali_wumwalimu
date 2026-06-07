import re
import json

with open("/home/jambo/Umwali/amategeko/dreamz.txt", "r") as f:
    lines = f.readlines()

questions = []
current_question = None

for line in lines:
    line = line.strip()
    if not line or "RESTRICTED" in line or re.match(r'^\d+$', line): 
        continue
    
    q_match = re.match(r'^(\d{1,3})\.\s+(.*)', line)
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
        # aggressive option matching
        opt_matches = re.finditer(r'\(?([a-d])\)?[\.\)]\s*', line, flags=re.IGNORECASE)
        matches = list(opt_matches)
        
        if matches:
            for i, m in enumerate(matches):
                key = m.group(1).lower()
                start = m.end()
                end = matches[i+1].start() if i+1 < len(matches) else len(line)
                
                text = line[start:end].strip()
                
                if '(' in m.group(0):
                    current_question["correctKey"] = key
                
                # Check if this key already exists, append text
                existing = next((o for o in current_question["options"] if o["key"] == key), None)
                if existing:
                    existing["text"] += " " + text
                else:
                    current_question["options"].append({"key": key, "text": text})
        else:
            if not current_question["options"]:
                current_question["text"] += " " + re.sub(r'\s{2,}', ' ', line)
            else:
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

# Group them into modules of 20 questions
for i, q in enumerate(clean):
    if len(q["options"]) >= 2:
        q["options"] = q["options"][:4]
    
    # Check category
    if "iki cyapa" in q["text"].lower() or "ibimenyetso" in q["text"].lower():
        q["category"] = "ibyapa"
    elif "km/h" in q["text"].lower() or "metero" in q["text"].lower():
        q["category"] = "numeric"
    else:
        q["category"] = "text"
        
    q["explanation"] = f"Igisubizo cy'ukuri ni {q['correctKey'].upper()} akurikijwe n'amategeko."
    
    # re-inject images
    if q["number"] in img_map:
        q["image"] = img_map[q["number"]]

with open("/home/jambo/Umwali/amategeko/src/data/questions_grouped.json", "w", encoding="utf-8") as f:
   json.dump(clean, f, ensure_ascii=False, indent=2)

