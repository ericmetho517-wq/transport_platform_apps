"""Extract the large report visuals used by the local Story Maps.

The reports remain the source of truth. Re-running this script rebuilds the
manifest and the web-ready image folder without inventing replacement media.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
from pathlib import Path

import pymupdf
from PIL import Image, ImageStat


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

ISMAILIA_MEDIA = {
    "image6.jpg": "axis-photo",
    "image9.png": "map",
    "image10.png": "map",
    "image11.jpeg": "map",
    "image12.jpeg": "map",
    "image13.jpeg": "map",
    "image14.jpeg": "map",
    "image15.jpeg": "map",
    "image16.jpeg": "map",
    "image17.png": "dashboard",
    "image18.jpeg": "comparison",
    "image19.jpeg": "comparison",
    "image20.jpeg": "comparison",
    "image21.jpeg": "comparison",
    "image22.jpeg": "comparison",
    "image23.jpeg": "comparison",
    "image24.jpeg": "comparison",
    "image25.jpeg": "comparison",
    "image26.png": "dashboard",
    "image27.png": "dashboard",
    "image28.jpeg": "map",
}

REJECTED_DIGEST_PREFIXES = {
    "15d2f9d8",  # decorative flag ribbon
    "2446ab6f",  # standalone ministry seal
    "3a5aacc2",  # generic train stock image in a road chapter
}

REJECTED_REPORT_PAGES = {
    "Final Report 3-2024.pdf": {15, 29},  # workshop/building photos
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
    return curate_records(records)


def curate_records(records: list[dict[str, object]]) -> list[dict[str, object]]:
    """Keep complete, presentation-ready project visuals only."""
    limits = {"axis-photo": 3, "map": 8, "comparison": 6, "dashboard": 4}
    counts = {kind: 0 for kind in limits}
    curated: list[dict[str, object]] = []
    for record in records:
        kind = str(record["kind"])
        if kind not in limits:
            continue
        width, height = int(record["width"]), int(record["height"])
        ratio = width / max(height, 1)
        digest = Path(str(record["imagePath"])).stem
        if any(digest.startswith(prefix) for prefix in REJECTED_DIGEST_PREFIXES):
            continue
        if int(record["page"]) in REJECTED_REPORT_PAGES.get(str(record["reportName"]), set()):
            continue
        if ratio < 0.9 or ratio > 2.7:
            continue
        if kind == "comparison" and is_dark_chart_fragment(record):
            continue
        if kind == "axis-photo" and int(record["page"]) != 1:
            continue
        if counts[kind] >= limits[kind]:
            continue
        counts[kind] += 1
        curated.append(record)
    return curated


def is_dark_chart_fragment(record: dict[str, object]) -> bool:
    """Reject cropped black chart pieces that were embedded separately in PDFs."""
    image = Path("public/references/story-media") / Path(str(record["imagePath"])).name
    try:
        with Image.open(image) as source:
            sample = source.convert("RGB")
            sample.thumbnail((180, 180))
            mean = sum(ImageStat.Stat(sample).mean) / 3
            dark_pixels = sum(sample.convert("L").histogram()[:38])
            return mean < 75 or dark_pixels / max(sample.width * sample.height, 1) > 0.5
    except OSError:
        return True


def extract_ismailia_docx(report_path: Path, output_dir: Path) -> list[dict[str, object]]:
    records: list[dict[str, object]] = []
    with zipfile.ZipFile(report_path) as archive:
        for filename, kind in ISMAILIA_MEDIA.items():
            data = archive.read(f"word/media/{filename}")
            digest = hashlib.sha256(data).hexdigest()
            extension = Path(filename).suffix.lower().lstrip(".").replace("jpeg", "jpg")
            target_name = f"{digest[:20]}.{extension}"
            target = output_dir / target_name
            if not target.exists():
                target.write_bytes(data)
            with pymupdf.open(stream=data, filetype=extension) as image_document:
                rect = image_document[0].rect
            records.append({
                "imagePath": f"../../references/story-media/{target_name}",
                "reportName": report_path.name,
                "page": 0,
                "kind": kind,
                "width": round(rect.width),
                "height": round(rect.height),
            })
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
    groups["ismailia"] = {
        "project": extract_ismailia_docx(args.reports / "قطاع_الاسماعيلية.docx", args.output)
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
    referenced = {
        Path(str(item["imagePath"])).name
        for entries in groups.values()
        for items in entries.values()
        for item in items
    }
    for image in args.output.iterdir():
        if image.is_file() and image.name not in referenced:
            image.unlink()
    count = sum(len(items) for entries in groups.values() for items in entries.values())
    print(f"Extracted {count} report visuals into {args.output}")


if __name__ == "__main__":
    main()
