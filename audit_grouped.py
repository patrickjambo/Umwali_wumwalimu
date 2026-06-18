#!/usr/bin/env python3
"""
Audit src/data/questions_grouped.json (the file seed-questions.ts uses)
against dreamz.txt (authoritative source).

For every question block in dreamz.txt we extract:
  - sequential options (relabelled a,b,c,d by position)
  - which option position is parenthesised  ==> the correct answer

Then for each grouped.json record we match it to its dreamz block (by number,
disambiguated by text similarity for duplicate numbers) and verify that the
record's correctKey points to the SAME answer text that dreamz marks.
"""
import json, re, sys
from difflib import SequenceMatcher

DREAMZ = "/home/jambo/Umwali/amategeko/dreamz.txt"
GROUPED = "/home/jambo/Umwali/amategeko/src/data/questions_grouped.json"


def norm(s):
    s = (s or "").lower()
    s = s.replace("’", "'").replace("‘", "'")
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def sim(a, b):
    return SequenceMatcher(None, norm(a), norm(b)).ratio()


def parse_dreamz(path):
    with open(path, encoding="utf-8") as f:
        lines = f.readlines()
    blocks = []  # each: {number, text, options:[{key,text,paren}]}
    cur = None
    q_start = re.compile(r"^(\d{1,3})\.\s*(.*)")
    # Two accepted option forms:
    #   parenthesised: "(c) text"  /  "(c )text"  /  "(d)text"   -> paren=True
    #   plain:         "a) text"   /  "a. text"   /  "a)text"    -> paren=False
    opt_paren = re.compile(r"^\(\s*([a-zA-Z])\s*\)\s*(.*)$")
    opt_plain = re.compile(r"^([a-zA-Z])\s*[\.\)]\s*(.*)$")
    for raw in lines:
        line = raw.strip()
        if "RESTRICTED" in line:
            continue
        if re.match(r"^\d{1,4}$", line):  # bare page number
            continue
        m = q_start.match(line)
        if m:
            if cur:
                blocks.append(cur)
            cur = {"number": int(m.group(1)), "text": m.group(2).strip(), "options": []}
            continue
        if not cur:
            continue
        if not line:
            continue
        mp = opt_paren.match(line)
        ms = opt_plain.match(line) if not mp else None
        om = mp or ms
        if om and len(line) > 1:
            paren = bool(mp)
            text = om.group(2).strip()
            key = chr(ord("a") + len(cur["options"]))
            cur["options"].append({"key": key, "text": text, "paren": paren})
        else:
            if not cur["options"]:
                cur["text"] += " " + re.sub(r"\s{2,}", " ", line)
            else:
                cur["options"][-1]["text"] += " " + re.sub(r"\s{2,}", " ", line)
    if cur:
        blocks.append(cur)
    return blocks


def block_answer_text(b):
    """Return text of parenthesised option, or None."""
    for o in b["options"]:
        if o["paren"]:
            return o["text"]
    return None


def main():
    blocks = parse_dreamz(DREAMZ)
    by_num = {}
    for b in blocks:
        by_num.setdefault(b["number"], []).append(b)

    with open(GROUPED, encoding="utf-8") as f:
        grouped = json.load(f)

    report = {
        "no_dreamz_block": [],      # grouped number not found in dreamz
        "dreamz_no_answer": [],     # dreamz block has no parenthesised option
        "answer_mismatch": [],      # grouped correctKey points to wrong text
        "ok": 0,
        "weak_match": [],           # matched but low text similarity (review)
    }

    for q in grouped:
        n = q["number"]
        cands = by_num.get(n, [])
        if not cands:
            report["no_dreamz_block"].append(n)
            continue
        # pick best matching block by question-text similarity
        best = max(cands, key=lambda b: sim(b["text"], q["text"]))
        tsim = sim(best["text"], q["text"])
        ans = block_answer_text(best)
        if ans is None:
            report["dreamz_no_answer"].append(n)
            continue
        # grouped's chosen-correct option text
        ck = str(q.get("correctKey", "")).strip().lower()
        chosen = [o for o in q["options"] if str(o["key"]).strip().lower() == ck]
        if not chosen:
            report["answer_mismatch"].append({"number": n, "reason": "correctKey not in options",
                                              "correctKey": ck})
            continue
        # does any chosen option text match the dreamz answer text well?
        best_opt_sim = max(sim(o["text"], ans) for o in chosen)
        if best_opt_sim < 0.6:
            # maybe grouped has the right answer under a different key (key bug)
            # find which grouped option best matches dreamz answer
            allbest = max(q["options"], key=lambda o: sim(o["text"], ans))
            report["answer_mismatch"].append({
                "number": n,
                "q": q["text"][:60],
                "grouped_correctKey": ck,
                "grouped_correct_text": chosen[0]["text"][:50],
                "dreamz_answer_text": (ans or "")[:50],
                "should_be_key": allbest["key"],
                "should_be_text": allbest["text"][:50],
                "ans_sim_to_should": round(sim(allbest["text"], ans), 2),
            })
        else:
            report["ok"] += 1
            if tsim < 0.7:
                report["weak_match"].append({"number": n, "tsim": round(tsim, 2)})

    print("=== AUDIT: questions_grouped.json vs dreamz.txt ===")
    print("grouped records      :", len(grouped))
    print("dreamz blocks parsed :", len(blocks))
    print("OK (answer matches)  :", report["ok"])
    print("No dreamz block      :", len(report["no_dreamz_block"]), report["no_dreamz_block"])
    print("Dreamz has no answer :", len(report["dreamz_no_answer"]), report["dreamz_no_answer"])
    print("ANSWER MISMATCHES    :", len(report["answer_mismatch"]))
    for m in report["answer_mismatch"]:
        print(json.dumps(m, ensure_ascii=False))
    print("Weak text matches (review):", len(report["weak_match"]), report["weak_match"][:30])


if __name__ == "__main__":
    main()
