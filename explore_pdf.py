import fitz

doc = fitz.open("/home/jambo/Downloads/dreamz.pdf")
found = False
for page_num in range(len(doc)):
    text = doc[page_num].get_text()
    if "Iki cyapa" in text or "241." in text:
        print(f"--- PAGE {page_num} ---")
        page = doc[page_num]
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            bbox = b["bbox"]
            if b["type"] == 0:
                full_text = " ".join([span["text"] for line in b["lines"] for span in line["spans"]])
                if full_text.strip():
                    print(f"TEXT [y0={bbox[1]:.1f}]: {full_text[:60].strip()}")
            elif b["type"] == 1:
                print(f"IMAGE [y0={bbox[1]:.1f}]")
        found = True
        break
