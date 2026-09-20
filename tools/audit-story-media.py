"""Inspect similarity between story gallery images and documented swipe images."""

import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
media = json.loads((ROOT / "registry/story-media.json").read_text(encoding="utf-8"))["groups"]
swipes = json.loads((ROOT / "registry/documentation-swipes.json").read_text(encoding="utf-8"))["groups"]


def fingerprint(url: str) -> int:
    image_path = ROOT / "public" / url.removeprefix("../../")
    with Image.open(image_path) as original:
        image = original.convert("L").resize((17, 16))
        pixels = image.tobytes()
    return sum(1 << (y * 16 + x) for y in range(16) for x in range(16)
               if pixels[y * 17 + x] > pixels[y * 17 + x + 1])


for group, chapters in media.items():
    for chapter, items in chapters.items():
        key = f"{group}/{chapter}" if group == "western-upper-egypt" else group
        pairs = swipes.get(key, [])
        swipe_hashes = [(fingerprint(pair[side]), pair[side]) for pair in pairs for side in ("before", "after")]
        for item in items:
            if not swipe_hashes:
                continue
            hashed = fingerprint(item["imagePath"])
            score, match = min(((hashed ^ other).bit_count(), url) for other, url in swipe_hashes)
            if score <= 30:
                print(key, item["kind"], item["page"], score, item["imagePath"], match)
        gallery = [item for item in items if not item.get("inSwipe")]
        for index, first in enumerate(gallery):
            for second in gallery[index + 1:]:
                if first["imagePath"] == second["imagePath"]:
                    print("DUPLICATE PATH", key, first["page"], second["page"])
                    continue
                score = (fingerprint(first["imagePath"]) ^ fingerprint(second["imagePath"])).bit_count()
                if score <= 12:
                    print("SIMILAR GALLERY", key, first["page"], second["page"], score)
