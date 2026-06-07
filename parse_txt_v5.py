import re
import json

with open("/home/jambo/Umwali/amategeko/dreamz.txt", "r") as f:
    lines = f.readlines()

questions = []
current_question = None

for i, line in enumerate(lines):
    line = line.strip()
    
    # Skip noise but allow empty lines to act as boundaries if needed
    if "RESTRICTED" in line or (re.match(r'^\d+$', line) and len(line) < 4): 
        continue
    
    # Match a question like "265. Ugeze ahabereye..."
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
        if not line:
            continue
            
        # Match options: can be (a) or a)
        # Note: the text in the PDF has typo where "b)" comes after "a)" and "a)" comes after "(a)".
        # To make it sequential, we will assign our own keys a, b, c, d rather than relying strictly on the text's key.
        opt_match = re.match(r'^\(?([a-z])\)?[\.\)]\s*(.*)', line, flags=re.IGNORECASE)
        
        if opt_match:
            doc_key = opt_match.group(1).lower()
            text = opt_match.group(2).strip()
            
            # Map correctly formatted keys instead of relying purely on the PDF typos
            # e.g. mapping successive options to a, b, c, d
            mapped_key = chr(ord('a') + len(current_question["options"]))
            
            if '(' in line.split()[0]: 
                current_question["correctKey"] = mapped_key
                
            current_question["options"].append({"key": mapped_key, "text": text})
        else:
            if not current_question["options"]:
                # Continuation of question text
                current_question["text"] += " " + re.sub(r'\s{2,}', ' ', line)
            else:
                # Continuation of option text
                current_question["options"][-1]["text"] += " " + re.sub(r'\s{2,}', ' ', line)

if current_question:
    questions.append(current_question)

clean = []
numbers = set()
pseudo_number = 1000

for q in questions:
    if len(q["options"]) >= 2:
        q["options"] = q["options"][:4]
        
        # Deduplicate numbers
        if q["number"] not in numbers:
            numbers.add(q["number"])
            pass
        else:
            pseudo_number += 1
            q["number"] = pseudo_number
            numbers.add(q["number"])
            
        clean.append(q)

print(f"Total parsed: {len(questions)}")
print(f"Total clean: {len(clean)}")

# Reload original JSON mapped images
try:
    with open("/home/jambo/Umwali/amategeko/src/data/questions.json", "r") as f:
        old_q = json.load(f)
    img_map = {q["number"]: q.get("image") for q in old_q if q.get("image")}
    print(f"Found {len(img_map)} original mapped images")
except Exception as e:
    print("Failed to load map:", e)
    img_map = {}

# Re map logic
for q in clean:
    if "iki cyapa" in q["text"].lower() or "ibimenyetso" in q["text"].lower() or "icyapa" in q["text"].lower():
        q["category"] = "ibyapa"
    elif "km/h" in q["text"].lower() or "metero" in q["text"].lower() or "santimetero" in q["text"].lower():
        q["category"] = "numeric"
    else:
        q["category"] = "text"
        
    q["explanation"] = f"Igisubizo cy'ukuri ni {q['correctKey'].upper()} akurikijwe n'amategeko."
    
    # Try mapping image using exact match or text fuzzy search if numbering changed
    if q["number"] in img_map:
        q["image"] = img_map[q["number"]]
    else:
        q["image"] = None

with open("/home/jambo/Umwali/amategeko/src/data/questions_v2.json", "w", encoding="utf-8") as f:
    json.dump(clean, f, ensure_ascii=False, indent=2)

