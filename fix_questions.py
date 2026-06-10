#!/usr/bin/env python3
"""
Fix questions.json by parsing dreamz.txt as the authoritative source.

Key issues to handle:
- Option-shift bug: last sentence of question text was parsed as option "a",
  shifting all real options by one
- Duplicate question numbers: Q52 (2 instances), Q96 (2 instances), Q8 (general + ibyapa)
- ibyapa section starts at line 3381
"""

import json
import re
import sys
from difflib import SequenceMatcher

DREAMZ_PATH = "/home/jambo/Umwali/amategeko/dreamz.txt"
QUESTIONS_PATH = "/home/jambo/Umwali/amategeko/src/data/questions.json"

IBYAPA_START_LINE = 3381  # 1-indexed line where ibyapa section begins


def similarity(a, b):
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def parse_dreamz(path):
    """
    Parse dreamz.txt and return:
    - general_questions: dict mapping qnum -> first occurrence question data
    - general_duplicates: dict mapping qnum -> list of ALL occurrences (for duplicates)
    - ibyapa_questions: dict mapping qnum -> question data (from ibyapa section, line 3381+)
    - ibyapa_q8: special Q8 entry from ibyapa section
    """
    with open(path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # Patterns
    q_start = re.compile(r'^(\d{1,3})\.\s+(.*)')
    correct_opt = re.compile(r'^\(\s*([a-dA-D])\s*\)(.*)')
    normal_opt = re.compile(r'^([a-dA-D])[)\.]\s*(.*)')
    skip_patterns = [re.compile(r'RESTRICTED'), re.compile(r'^\s*\d+\s*$')]

    def should_skip(line):
        stripped = line.strip()
        for p in skip_patterns:
            if p.search(stripped):
                return True
        return False

    def parse_section(section_lines, start_lineno=1):
        """
        Parse a section of lines into a list of question dicts.
        start_lineno is the 1-indexed line number of section_lines[0] in original file.
        Returns list of dicts: {number, text, options, correctKey}
        """
        questions = []
        current_q = None
        current_option_key = None
        current_option_text = None

        def finalize_option():
            nonlocal current_option_key, current_option_text
            if current_option_key and current_q:
                current_q['options'][current_option_key] = current_option_text.strip()
                current_option_key = None
                current_option_text = None

        def finalize_question():
            nonlocal current_q
            if current_q:
                finalize_option()
                # Join text list and clean up
                if isinstance(current_q['text'], list):
                    current_q['text'] = ' '.join(current_q['text'])
                current_q['text'] = ' '.join(current_q['text'].split())
                questions.append(current_q)
                current_q = None

        for i, raw_line in enumerate(section_lines):
            line = raw_line.rstrip('\n')

            if should_skip(line):
                continue

            stripped = line.strip()
            if not stripped:
                continue

            # Check if this is a new question
            qm = q_start.match(stripped)
            if qm:
                finalize_question()
                qnum = int(qm.group(1))
                qtext = qm.group(2).strip()
                current_q = {
                    'number': qnum,
                    'text': [qtext],  # will be joined later
                    'options': {},
                    'correctKey': None
                }
                current_option_key = None
                current_option_text = None
                continue

            if current_q is None:
                continue

            # Check if correct option
            cm = correct_opt.match(stripped)
            if cm:
                finalize_option()
                key = cm.group(1).lower()
                text = cm.group(2).strip()
                current_q['correctKey'] = key
                current_option_key = key
                current_option_text = text
                continue

            # Check if normal option
            nm = normal_opt.match(stripped)
            if nm:
                finalize_option()
                key = nm.group(1).lower()
                text = nm.group(2).strip()
                current_option_key = key
                current_option_text = text
                continue

            # Continuation line - append to current option or question text
            if current_option_key:
                current_option_text = (current_option_text + ' ' + stripped).strip()
            elif current_q and not current_q['options']:
                # Still in question text
                current_q['text'].append(stripped)

        finalize_question()

        # Text is already joined by finalize_question; just ensure clean
        for q in questions:
            q['text'] = ' '.join(q['text'].split())

            # Build options list
            opts_list = []
            for k in ['a', 'b', 'c', 'd']:
                if k in q['options']:
                    opts_list.append({'key': k, 'text': q['options'][k]})
            q['options'] = opts_list

        return questions

    # Split into general section (lines 0 to IBYAPA_START_LINE-2) and ibyapa section
    general_lines = lines[:IBYAPA_START_LINE - 1]
    ibyapa_lines = lines[IBYAPA_START_LINE - 1:]

    general_qs = parse_section(general_lines)
    ibyapa_qs = parse_section(ibyapa_lines, start_lineno=IBYAPA_START_LINE)

    # Build lookup dicts
    # For general: keep track of ALL occurrences per number (for duplicates)
    general_by_num = {}
    general_duplicates = {}
    for q in general_qs:
        n = q['number']
        if n not in general_duplicates:
            general_duplicates[n] = []
        general_duplicates[n].append(q)

    # First occurrence only for general lookup
    for n, qs in general_duplicates.items():
        general_by_num[n] = qs[0]

    # For ibyapa section
    ibyapa_by_num = {}
    ibyapa_q8 = None
    for q in ibyapa_qs:
        n = q['number']
        if n == 8:
            ibyapa_q8 = q
        elif n not in ibyapa_by_num:
            ibyapa_by_num[n] = q

    return general_by_num, general_duplicates, ibyapa_by_num, ibyapa_q8


def fix_questions(questions_path, general_by_num, general_duplicates, ibyapa_by_num, ibyapa_q8):
    """Load questions.json and fix each question against dreamz data."""
    with open(questions_path, "r", encoding="utf-8") as f:
        questions = json.load(f)

    fixed_count = 0
    not_found = []
    unchanged = []

    # Identify duplicate-number entries in questions.json
    # Group by question number
    num_to_indices = {}
    for i, q in enumerate(questions):
        n = q['number']
        if n not in num_to_indices:
            num_to_indices[n] = []
        num_to_indices[n].append(i)

    for i, q in enumerate(questions):
        qnum = q['number']
        cat = q.get('category', '')

        # Special case: ibyapa Q8
        if qnum == 8 and cat == 'ibyapa':
            if ibyapa_q8:
                src = ibyapa_q8
                q['text'] = src['text']
                q['options'] = src['options']
                q['correctKey'] = src['correctKey']
                fixed_count += 1
            else:
                not_found.append(f"Q8 (ibyapa) - no ibyapa Q8 found in dreamz")
            continue

        # General Q8
        if qnum == 8 and cat != 'ibyapa':
            if qnum in general_by_num:
                src = general_by_num[qnum]
                q['text'] = src['text']
                q['options'] = src['options']
                q['correctKey'] = src['correctKey']
                fixed_count += 1
            else:
                not_found.append(f"Q{qnum} (general) - not found")
            continue

        # Handle duplicate-number questions (Q52, Q96)
        if qnum in general_duplicates and len(general_duplicates[qnum]) > 1:
            indices = num_to_indices.get(qnum, [])
            if len(indices) > 1:
                # Match by similarity
                best_src = None
                best_score = -1
                for dreamz_q in general_duplicates[qnum]:
                    # Compare question text
                    score = similarity(q.get('text', ''), dreamz_q['text'])
                    # Also compare first option if available
                    if q.get('options') and dreamz_q['options']:
                        # Compare first option texts from dreamz with all json options
                        dreamz_first_opt = dreamz_q['options'][0]['text'] if dreamz_q['options'] else ''
                        # Check if any json option is close to any dreamz option
                        best_opt_score = 0
                        for jopt in q.get('options', []):
                            for dopt in dreamz_q['options']:
                                s = similarity(jopt.get('text', ''), dopt['text'])
                                if s > best_opt_score:
                                    best_opt_score = s
                        score = (score + best_opt_score) / 2
                    if score > best_score:
                        best_score = score
                        best_src = dreamz_q
                if best_src:
                    q['text'] = best_src['text']
                    q['options'] = best_src['options']
                    q['correctKey'] = best_src['correctKey']
                    fixed_count += 1
                else:
                    not_found.append(f"Q{qnum} duplicate - no match found")
            else:
                # Only one in json, use first dreamz occurrence
                src = general_by_num[qnum]
                q['text'] = src['text']
                q['options'] = src['options']
                q['correctKey'] = src['correctKey']
                fixed_count += 1
            continue

        # ibyapa category questions (not Q8)
        if cat == 'ibyapa':
            if qnum in ibyapa_by_num:
                src = ibyapa_by_num[qnum]
                q['text'] = src['text']
                q['options'] = src['options']
                q['correctKey'] = src['correctKey']
                fixed_count += 1
            elif qnum in general_by_num:
                # Fallback to general
                src = general_by_num[qnum]
                q['text'] = src['text']
                q['options'] = src['options']
                q['correctKey'] = src['correctKey']
                fixed_count += 1
            else:
                not_found.append(f"Q{qnum} (ibyapa) - not found in dreamz")
            continue

        # Standard case: try general first, then ibyapa
        if qnum in general_by_num:
            src = general_by_num[qnum]
            q['text'] = src['text']
            q['options'] = src['options']
            q['correctKey'] = src['correctKey']
            fixed_count += 1
        elif qnum in ibyapa_by_num:
            src = ibyapa_by_num[qnum]
            q['text'] = src['text']
            q['options'] = src['options']
            q['correctKey'] = src['correctKey']
            fixed_count += 1
        else:
            not_found.append(f"Q{qnum} - not found in dreamz")

    return questions, fixed_count, not_found


def validate(questions, general_by_num, general_duplicates, ibyapa_by_num, ibyapa_q8):
    """Validate fixed questions against dreamz data."""
    mismatches = []

    for q in questions:
        qnum = q['number']
        cat = q.get('category', '')

        # Get dreamz source - for duplicates, find the best-matching dreamz entry
        if qnum == 8 and cat == 'ibyapa':
            src = ibyapa_q8
        elif qnum in general_duplicates and len(general_duplicates[qnum]) > 1:
            # Find the dreamz entry whose text best matches this json entry
            best_src = None
            best_score = -1
            for dreamz_q in general_duplicates[qnum]:
                score = similarity(q.get('text', ''), dreamz_q['text'])
                if score > best_score:
                    best_score = score
                    best_src = dreamz_q
            src = best_src
        elif cat == 'ibyapa' and qnum in ibyapa_by_num:
            src = ibyapa_by_num[qnum]
        elif qnum in general_by_num:
            src = general_by_num[qnum]
        elif qnum in ibyapa_by_num:
            src = ibyapa_by_num[qnum]
        else:
            src = None

        if src is None:
            continue

        # Check correctKey
        if q.get('correctKey') != src['correctKey']:
            mismatches.append({
                'number': qnum,
                'category': cat,
                'json_correctKey': q.get('correctKey'),
                'dreamz_correctKey': src['correctKey'],
                'json_text_start': q.get('text', '')[:60],
            })

    return mismatches


def main():
    print("Parsing dreamz.txt...")
    general_by_num, general_duplicates, ibyapa_by_num, ibyapa_q8 = parse_dreamz(DREAMZ_PATH)

    print(f"  General questions parsed: {len(general_by_num)}")
    dups = {k: v for k, v in general_duplicates.items() if len(v) > 1}
    print(f"  Duplicate question numbers in general section: {list(dups.keys())}")
    print(f"  ibyapa questions parsed: {len(ibyapa_by_num) + (1 if ibyapa_q8 else 0)}")
    if ibyapa_q8:
        print(f"  ibyapa Q8 found: '{ibyapa_q8['text'][:60]}...'")

    # Debug: show a few questions to verify parsing
    for n in [1, 2, 3, 10, 52]:
        if n in general_duplicates:
            for idx, q in enumerate(general_duplicates[n]):
                print(f"\n  [DEBUG] General Q{n} occurrence {idx+1}:")
                print(f"    text: {q['text'][:80]}")
                print(f"    correctKey: {q['correctKey']}")
                if q['options']:
                    print(f"    options[0]: {q['options'][0]}")

    print("\nFixing questions.json...")
    questions, fixed_count, not_found = fix_questions(
        QUESTIONS_PATH, general_by_num, general_duplicates, ibyapa_by_num, ibyapa_q8
    )

    print(f"  Total questions: {len(questions)}")
    print(f"  Fixed: {fixed_count}")
    print(f"  Not found in dreamz: {len(not_found)}")
    for nf in not_found:
        print(f"    - {nf}")

    print("\nWriting fixed questions.json...")
    with open(QUESTIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    print("  Done.")

    print("\nRunning validation...")
    mismatches = validate(questions, general_by_num, general_duplicates, ibyapa_by_num, ibyapa_q8)
    if mismatches:
        print(f"  REMAINING MISMATCHES ({len(mismatches)}):")
        for m in mismatches:
            print(f"    Q{m['number']} ({m['category']}): json={m['json_correctKey']} dreamz={m['dreamz_correctKey']}")
            print(f"      text: {m['json_text_start']}")
    else:
        print("  All correctKeys match dreamz! No mismatches.")

    print("\nSummary:")
    print(f"  Questions fixed: {fixed_count}")
    print(f"  Questions not found in dreamz: {len(not_found)}")
    print(f"  Remaining correctKey mismatches: {len(mismatches)}")


if __name__ == '__main__':
    main()
