import fitz
import re
import json
import base64

doc = fitz.open("/home/jambo/Downloads/dreamz.pdf")

# We will load the CURRENT questions.json which has 280 items correctly parsed textually
with open("/home/jambo/Umwali/amategeko/src/data/questions.json", "r") as f:
    target_questions = json.load(f)

# Loop all pages, save images 
img_map = []
for page_num in range(len(doc)):
    page = doc[page_num]
    blocks = page.get_text("dict")["blocks"]

    for b in blocks:
        if b["type"] == 1:
            # Found image
            img_map.append({"page": page_num, "y": b["bbox"][1], "b": b})

# Now loop questions and try to associate text to the closest image on the same page
text_map = []
for page_num in range(len(doc)):
    page = doc[page_num]
    blocks = page.get_text("dict")["blocks"]

    for b in blocks:
        if b["type"] == 0:
            full_text = " ".join([span["text"] for line in b["lines"] for span in line["spans"]]).strip()
            q_match = re.match(r'^(\d{1,3})\.\s*', full_text)
            if q_match:
                text_map.append({"q_num": int(q_match.group(1)), "page": page_num, "y": b["bbox"][3]})

# Pair them up
paired = set()
for q_img in img_map:
    # Find closest text question above it on the same page
    closest_q_num = None
    min_dist = float('inf')
    for q_txt in text_map:
        if q_txt["page"] == q_img["page"]:
            dist = q_img["y"] - q_txt["y"]
            if dist > -50 and dist < min_dist:
                min_dist = dist
                closest_q_num = q_txt["q_num"]

    if closest_q_num and closest_q_num not in paired:
        paired.add(closest_q_num)
        
        # Inject into target
        for target in target_questions:
            if target["number"] == closest_q_num:
                target["image"] = f"data:image/{q_img['b']['ext']};base64,{base64.b64encode(q_img['b']['image']).decode('utf-8')}"
                if "iki cyapa" in target["text"].lower():
                     target["category"] = "ibyapa"
                break

with open("/home/jambo/Umwali/amategeko/src/data/questions.json", "w", encoding="utf-8") as f:
    json.dump(target_questions, f, ensure_ascii=False, indent=2)

print(f"Injected images into {len(paired)} existing questions!")
