import json
with open("/home/jambo/Umwali/amategeko/src/data/questions_v2.json", "r") as f:
    questions = json.load(f)

c = 0
for q in questions:
    if "cyapa" in q["text"].lower() and q["image"] is None:
        print(f"Question {q['number']} missing image: {q['text'][:50]}... | {q['options'][0]['text'][:30]}")
        c += 1
print(f"Total missing images for 'cyapa': {c}")
