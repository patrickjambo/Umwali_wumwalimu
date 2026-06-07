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
    
    # New question starts with "1. "
    q_match = re.match(r'^(\d{1,3})\.\s+(.*)', line)
    if q_match:
        if current_question:
            questions.append(current_question)
        current_question = {
            "number": int(q_match.group(1)),
            "text": q_match.group(2).strip(),
            "options": [],
            "correctKey": "a" # default
        }
    elif current_question:
        # Match options: a)  or (a)  or a.
        opt_match = re.match(r'^\(?([a-d])\)?[\.\)]\s*(.*)', line, flags=re.IGNORECASE)
        if opt_match:
            key = opt_match.group(1).lower()
            text = opt_match.group(2).strip()
            # If the option key actually had parenthesis, it means it's the correct answer!
            # Let's check original line if it started with '('
            if line.startswith('('):
                current_question["correctKey"] = key
            
            current_question["options"].append({
                "key": key,
                "text": text
            })
        else:
            # If it doesn't match an option, but we don't have options yet, it might be a continuation of the question text
            if len(current_question["options"]) == 0:
                # Sometimes there's massive space due to layout. Replace double spaces with single space.
                clean_line = re.sub(r'\s{2,}', ' ', line)
                current_question["text"] += " " + clean_line
            else:
                # Continuation of option text
                clean_line = re.sub(r'\s{2,}', ' ', line)
                current_question["options"][-1]["text"] += " " + clean_line

if current_question:
    questions.append(current_question)

# Clean options
for q in questions:
    if len(q["options"]) >= 2:
        q["options"] = q["options"][:4]

with open("/home/jambo/Umwali/amategeko/src/data/questions_txt.json", "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"Extracted {len(questions)} questions from TXT!")
