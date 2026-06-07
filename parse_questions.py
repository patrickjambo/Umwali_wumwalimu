import re
import json

def parse_pdf_text(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    questions = []
    
    # Split text by question numbers using a regex pattern
    pattern = re.compile(r'\n(\d+)\.\s+(.*?)(?=\n\d+\.\s+|\Z)', re.DOTALL)
    
    matches = pattern.finditer(text)
    
    for match in matches:
        q_num = match.group(1)
        q_block = match.group(2).strip()
        
        lines = [line.strip() for line in q_block.split('\n') if line.strip()]
        
        q_text = ""
        correct_key = 'a' # Default fallback
        options = []
        
        opt_pattern = re.compile(r'^(\()?[a-d](\))?[\.\)]?\s*(.*)', re.IGNORECASE)
        
        for line in lines:
            opt_match = opt_pattern.match(line)
            if opt_match:
                opt_content = opt_match.group(3).strip()
                
                prefix_match = re.match(r'^(\()?[a-d](\))?[\.\)]?', line, re.IGNORECASE)
                if prefix_match:
                    prefix = prefix_match.group(0).lower()
                    key = 'a'
                    if 'b' in prefix: key = 'b'
                    elif 'c' in prefix: key = 'c'
                    elif 'd' in prefix: key = 'd'
                
                    options.append({ "key": key, "text": opt_content })

                    # Detect correctness
                    if '(' in prefix and ')' in prefix:
                        correct_key = key
            else:
                if not options:
                    if line not in ["IKINYARWANDA", "RESTRICTED"] and not line.isdigit():
                        q_text += " " + line if q_text else line
                        
        if len(options) > 0 and q_text:
            questions.append({
                "number": int(q_num),
                "text": q_text.strip(),
                "options": options,
                "correctKey": correct_key,
                "explanation": "Igisubizo ni " + correct_key.upper(),
            })
            
    return questions

qs = parse_pdf_text('/home/jambo/Downloads/dreamz.txt')
print(f"Parsed {len(qs)} questions.")

with open('/home/jambo/Umwali/amategeko/src/data/questions.json', 'w', encoding='utf-8') as f:
    json.dump(qs, f, ensure_ascii=False, indent=2)

