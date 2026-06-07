import json

with open("/home/jambo/Umwali/amategeko/src/data/questions.json", "r") as f:
    old_q = json.load(f)

with open("/home/jambo/Umwali/amategeko/src/data/questions_v2.json", "r") as f:
    new_q = json.load(f)

print("Old images:", len([q for q in old_q if q.get("image")]))

# Map by first option
old_map = {}
for q in old_q:
    if q.get("image") and len(q.get("options", [])) > 0:
        opt_text = "".join(q["options"][0]["text"].split()).lower()
        old_map[opt_text] = q["image"]

matches = 0
for q in new_q:
    if len(q.get("options", [])) > 0:
        opt_text = "".join(q["options"][0]["text"].split()).lower()
        if opt_text in old_map:
            q["image"] = old_map[opt_text]
            matches += 1

print("Matched images:", matches)

with open("/home/jambo/Umwali/amategeko/src/data/questions_v2.json", "w", encoding="utf-8") as f:
    json.dump(new_q, f, ensure_ascii=False, indent=2)

