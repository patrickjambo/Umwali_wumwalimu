import json
with open("/home/jambo/Umwali/amategeko/src/data/questions_txt.json", "r") as f:
    clean = json.load(f)

print(f"Clean has {len(clean)}")
