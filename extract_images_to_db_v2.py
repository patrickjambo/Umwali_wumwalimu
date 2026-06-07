import fitz
import re
import json
import base64

doc = fitz.open("/home/jambo/Downloads/dreamz.pdf")

with open("/home/jambo/Umwali/amategeko/src/data/questions.json", "r") as f:
    target_questions = json.load(f)

# Loop all pages, save images 
img_map = []
for page_num in range(len(doc)):
    blocks = doc[page_num].get_text("dict")["blocks"]
    for b in blocks:
        if b["type"] == 1:
            img_map.append({"page": page_num, "y": b["bbox"][1], "b": b})

# Try to associate text to the closest image on the SAME page
text_map = []
for page_num in range(len(doc)):
    blocks = doc[page_num].get_text("dict")["blocks"]
    for b in blocks:
        if b["type"] == 0:
            full_text = " ".join([span["text"] for line in b["lines"] for span in line["spans"]]).strip()
            # Match 241., 241, 1., etc
            q_match = re.search(r'(?:\A|\s)(\d{1,3})\.\s+(Iki cyapa|Ku byerekeye|Muri ibi|Ni ikihe|Icyapa)', full_text, flags=re.IGNORECASE)
            
            # Since some questions might be broken across blocks, we brute force match any text containing question numbers.
            nums_found = re.findall(r'(?:\A|\s)(\d{1,3})\.\s', full_text)
            for n in nums_found:
                text_map.append({"q_num": int(n), "page": page_num, "y": b["bbox"][3]})

paired = set()
for q_img in img_map:
    closest_q_num = None
    min_dist = float('inf')
    for q_txt in text_map:
        if q_txt["page"] == q_img["page"]:
            # Image is usually below the question text
            dist = q_img["y"] - q_txt["y"]
            if dist > -150 and dist < 400 and dist < min_dist:  # broadened range
                min_dist = dist
                closest_q_num = q_txt["q_num"]

    if closest_q_num and closest_q_num not in paired:
        paired.add(closest_q_num)
        for target in target_questions:
            if target["number"] == closest_q_num:
                target["image"] = f"data:image/{q_img['b']['ext']};base64,{base64.b64encode(q_img['b']['image']).decode('utf-8')}"
                if "iki cyapa" in target["text"].lower() or "ibimenyetso" in target["text"].lower():
                     target["category"] = "ibyapa"
                break

with open("/home/jambo/Umwali/amategeko/src/data/questions.json", "w", encoding="utf-8") as f:
    json.dump(target_questions, f, ensure_ascii=False, indent=2)

print(f"Injected images into {len(paired)} existing questions!")
