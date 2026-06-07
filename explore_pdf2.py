import fitz

doc = fitz.open("/home/jambo/Downloads/dreamz.pdf")
for page_num in range(35, 45):
    text = doc[page_num].get_text()
    if "gisobanura iki" in text.lower():
        print(f"--- PAGE {page_num} ---")
        page = doc[page_num]
        blocks = page.get_text("dict")["blocks"]
        for b in blocks:
            bbox = b["bbox"]
            if b["type"] == 0:
                full_text = " ".join([span["text"] for line in b["lines"] for span in line["spans"]])
                if full_text.strip():
                    print(f"TEXT [y0={bbox[1]:.1f}]: {full_text[:80].strip()}")
            elif b["type"] == 1:
                print(f"IMAGE [y0={bbox[1]:.1f}]")
        break
