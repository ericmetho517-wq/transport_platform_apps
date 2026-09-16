"""Build contact sheets for embedded Word/PowerPoint images without changing sources."""

from pathlib import Path
from zipfile import ZipFile
from PIL import Image, ImageDraw
from io import BytesIO
import json
import sys

source = Path(sys.argv[1])
output = Path(sys.argv[2])
output.mkdir(parents=True, exist_ok=True)
manifest = {}

for document in ([source] if source.is_file() else sorted(source.iterdir())):
    if document.suffix.lower() not in {".docx", ".pptx"}:
        continue
    with ZipFile(document) as archive:
        entries = [name for name in archive.namelist() if name.startswith(("word/media/", "ppt/media/")) and name.lower().endswith((".png", ".jpg", ".jpeg"))]
        tiles = []
        records = []
        for index, name in enumerate(entries):
            try:
                with Image.open(BytesIO(archive.read(name))) as image:
                    size = image.size
                    thumb = image.convert("RGB")
                    thumb.thumbnail((260, 185))
            except Exception:
                continue
            tile = Image.new("RGB", (280, 220), "white")
            tile.paste(thumb, ((280 - thumb.width) // 2, 4))
            draw = ImageDraw.Draw(tile)
            draw.text((7, 193), f"{index}: {name.split('/')[-1]} {size[0]}x{size[1]}", fill="black")
            tiles.append(tile)
            records.append({"index": index, "name": name, "width": size[0], "height": size[1]})
        manifest[document.name] = records
        cols = 5
        rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 280, rows * 220), "#e8eeee")
        for index, tile in enumerate(tiles):
            sheet.paste(tile, ((index % cols) * 280, (index // cols) * 220))
        sheet.save(output / f"{document.stem}.jpg", quality=86)

(output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Reviewed {len(manifest)} source documents and {sum(map(len, manifest.values()))} embedded images")
