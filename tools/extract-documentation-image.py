"""Extract one original embedded image for source review without altering it."""

from pathlib import Path
from zipfile import ZipFile
import sys

document = Path(sys.argv[1])
index = int(sys.argv[2])
output = Path(sys.argv[3])
with ZipFile(document) as archive:
    images = [name for name in archive.namelist() if name.startswith(("word/media/", "ppt/media/")) and name.lower().endswith((".png", ".jpg", ".jpeg"))]
    data = archive.read(images[index])
output.parent.mkdir(parents=True, exist_ok=True)
output.write_bytes(data)
print(f"{document.name} [{index}] -> {output} ({len(data)} bytes)")
