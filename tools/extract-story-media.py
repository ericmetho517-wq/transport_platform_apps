"""Extract the large report visuals used by the local Story Maps.

The reports remain the source of truth. Re-running this script rebuilds the
manifest and the web-ready image folder without inventing replacement media.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

import pymupdf


WESTERN_REPORTS = {
    "abu-simbel": ".pdf",
    "luxor": "(1).pdf",
    "qena": "(3).pdf",
    "sohag": "(2).pdf",
    "assiut": "(4).pdf",
    "minya": "(5).pdf",
    "fayoum": "(6).pdf",
    "giza": "(7).pdf",
    "corridor-overview": "(9).pdf",
}

FINAL_REPORT_RANGES = {
    "regional-ring-road": (12, 80),
    "dahshur-south-link": (81, 136),
    "suez-ring-link": (137, 177),
    "qena-luxor-road": (178, 226),
    "qus-axis": (227, 277),
    "kalabsha-axis": (278, 341),
}


def media_kind(text: str, width: int, height: int, image_index: int) -> str:
    compact = re.sub(r"\s+", " ", text)
    if re.search(r"Story\s*Map|قصة مكانية|محتوى مكاني", compact, re.I):
        return "axis-photo" if width / max(height, 1) > 2.15 and image_index == 0 else "comparison"
    if re.search(r"لوحة|مؤشرات|Dashboard", compact, re.I):
        return "dashboard"
    if re.search(r"مقارن|قبل وبعد|swipe", compact, re.I):
        return "comparison"
    if re.search(r"خريطة|منطقة الدراسة|استخدامات الأراضي|Map", compact, re.I):
        return "map"
    if width / max(height, 1) > 1.55:
        return "axis-photo"
    return "evidence"


def extract_report(
    report_path: Path,
    output_dir: Path,
    page_start: int = 1,
    page_end: int | None = None,
) -> list[dict[str, object]]:
    document = pymupdf.open(report_path)
    first = max(page_start, 1)
    last = min(page_end or len(document), len(document))
    seen_xrefs: set[int] = set()
    seen_hashes: set[str] = set()
    records: list[dict[str, object]] = []

    for page_number in range(first, last + 1):
        page = document[page_number - 1]
        page_area = page.rect.width * page.rect.height
        # Ignore the repeated report footer; it contains "before and after"
        # on every page and must not turn every visual into a comparison.
        page_text = page.get_text(clip=pymupdf.Rect(0, 0, page.rect.width, page.rect.height * 0.9))
        candidates = []
        for image in page.get_image_info(xrefs=True):
            xref = int(image.get("xref") or 0)
            width = int(image.get("width") or 0)
            height = int(image.get("height") or 0)
            box = pymupdf.Rect(image["bbox"])
            displayed_share = box.width * box.height / max(page_area, 1)
            if not xref or xref in seen_xrefs:
                continue
            if width < 700 or height < 300 or width * height < 250_000 or displayed_share < 0.075:
                continue
            candidates.append((xref, width, height))

        for image_index, (xref, width, height) in enumerate(candidates):
            seen_xrefs.add(xref)
            extracted = document.extract_image(xref)
            data = extracted["image"]
            digest = hashlib.sha256(data).hexdigest()
            if digest in seen_hashes:
                continue
            seen_hashes.add(digest)
            extension = str(extracted.get("ext") or "jpg").lower().replace("jpeg", "jpg")
            if extension not in {"jpg", "png", "webp"}:
                continue
            filename = f"{digest[:20]}.{extension}"
            target = output_dir / filename
            if not target.exists():
                target.write_bytes(data)
            kind = media_kind(page_text, width, height, image_index)
            records.append({
                "imagePath": f"../../references/story-media/{filename}",
                "reportName": report_path.name,
                "page": page_number,
                "kind": kind,
                "width": width,
                "height": height,
            })
    document.close()
    return records


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--reports", type=Path, required=True)
    parser.add_argument("--output", type=Path, default=Path("public/references/story-media"))
    parser.add_argument("--manifest", type=Path, default=Path("registry/story-media.json"))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    for old_image in args.output.iterdir():
        if old_image.is_file():
            old_image.unlink()

    groups: dict[str, dict[str, list[dict[str, object]]]] = {"western-upper-egypt": {}}
    for key, report_name in WESTERN_REPORTS.items():
        groups["western-upper-egypt"][key] = extract_report(args.reports / report_name, args.output)

    groups["cairo-suez-road"] = {
        "project": extract_report(args.reports / "(8).pdf", args.output)
    }
    final_report = args.reports / "Final Report 3-2024.pdf"
    for group, (start, end) in FINAL_REPORT_RANGES.items():
        groups[group] = {"project": extract_report(final_report, args.output, start, end)}

    manifest = {
        "version": 1,
        "source": "وزارة النقل/التقارير",
        "groups": groups,
    }
    args.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    count = sum(len(items) for entries in groups.values() for items in entries.values())
    print(f"Extracted {count} report visuals into {args.output}")


if __name__ == "__main__":
    main()
