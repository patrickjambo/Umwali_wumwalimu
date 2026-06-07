import json
with open("/home/jambo/Umwali/amategeko/src/data/questions_txt.json", "r") as f:
    qs = json.load(f)

nums = [q["number"] for q in qs]
for i in range(1, 434):
    if i not in nums:
        print(f"Missing: {i}")

