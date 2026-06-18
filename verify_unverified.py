#!/usr/bin/env python3
"""
Cross-check the questions that dreamz.txt CANNOT verify (no parenthesised answer
in the source) against the two other answer sources we have:

  - questions.json     : 283 records, previously audited against dreamz (memory)
  - questions_v2.json   : 402 records, fuller parse, every record has correctKey

For each unverifiable grouped record we compare the *text* of its chosen-correct
option against the chosen-correct option text in each source (option ORDER can
differ between files, so the key letter is meaningless; only the text matters).

Outcome per record:
  AGREE     - a source's correct-answer text matches grouped's  -> now verified
  DISAGREE  - a source's correct-answer text matches a DIFFERENT grouped option
  NO_SOURCE - neither source has this question with enough confidence
"""
import json
from audit_grouped import parse_dreamz, sim, block_answer_text, DREAMZ, GROUPED

QJSON = "/home/jambo/Umwali/amategeko/src/data/questions.json"
QV2 = "/home/jambo/Umwali/amategeko/src/data/questions_v2.json"

TEXT_MATCH = 0.72   # question texts must be at least this similar to be "the same Q"
ANS_MATCH = 0.75    # answer texts at/above this are "the same answer"


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def correct_text(rec):
    ck = str(rec.get("correctKey", "")).strip().lower()
    for o in rec.get("options", []):
        if str(o.get("key", "")).strip().lower() == ck:
            return o.get("text", "")
    return None


def unverifiable_records(grouped, blocks):
    """Mirror audit_grouped: grouped records whose best dreamz block has no answer."""
    by_num = {}
    for b in blocks:
        by_num.setdefault(b["number"], []).append(b)
    out = []
    for q in grouped:
        cands = by_num.get(q["number"], [])
        if not cands:
            continue
        best = max(cands, key=lambda b: sim(b["text"], q["text"]))
        if block_answer_text(best) is None:
            out.append(q)
    return out


def best_source_match(q, source):
    """Best same-question record in `source` (number-filtered, text-ranked)."""
    cands = [r for r in source if r.get("number") == q["number"]] or source
    best, bests = None, 0.0
    for r in cands:
        s = sim(r.get("text", ""), q["text"])
        if s > bests:
            bests, best = s, r
    return (best, bests) if bests >= TEXT_MATCH else (None, bests)


def main():
    grouped = load(GROUPED)
    qjson = load(QJSON)
    qv2 = load(QV2)
    blocks = parse_dreamz(DREAMZ)

    targets = unverifiable_records(grouped, blocks)
    print(f"Unverifiable-by-dreamz records: {len(targets)}")
    print("=" * 78)

    agree, disagree, nosrc = [], [], []
    for q in targets:
        gtext = correct_text(q)
        verdict = None
        for sname, src in (("questions.json", qjson), ("questions_v2.json", qv2)):
            rec, tsim = best_source_match(q, src)
            if not rec:
                continue
            stext = correct_text(rec)
            if not stext or gtext is None:
                continue
            if sim(stext, gtext) >= ANS_MATCH:
                verdict = ("AGREE", sname, round(tsim, 2))
                break
            # source's answer matches a DIFFERENT grouped option -> real conflict
            alt = max(q["options"], key=lambda o: sim(o.get("text", ""), stext))
            if sim(alt.get("text", ""), stext) >= ANS_MATCH and str(alt["key"]).lower() != str(q.get("correctKey", "")).lower():
                verdict = ("DISAGREE", sname, {
                    "grouped_key": q.get("correctKey"), "grouped_text": (gtext or "")[:45],
                    "source_answer": stext[:45], "should_be_key": alt["key"],
                })
                break
        if verdict is None:
            nosrc.append(q["number"])
        elif verdict[0] == "AGREE":
            agree.append((q["number"], verdict[1]))
        else:
            disagree.append((q["number"], verdict[2]))

    print(f"AGREE (now cross-verified): {len(agree)}")
    print(f"DISAGREE (conflict, review): {len(disagree)}")
    for n, d in disagree:
        print("  #%s %s" % (n, json.dumps(d, ensure_ascii=False)))
    print(f"NO_SOURCE (still unverified): {len(nosrc)} {sorted(set(nosrc))}")


if __name__ == "__main__":
    main()
