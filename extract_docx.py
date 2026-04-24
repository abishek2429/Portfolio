from collections import defaultdict
from zipfile import ZipFile
from pathlib import Path
import xml.etree.ElementTree as ET
import sys

path = Path(sys.argv[1])
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

parts = defaultdict(list)

with ZipFile(path) as z:
    names = [name for name in z.namelist() if name.startswith('word/') and name.endswith('.xml')]
    for name in names:
        try:
            root = ET.fromstring(z.read(name))
        except ET.ParseError:
            continue
        for text_node in root.findall('.//w:t', ns):
            if text_node.text and text_node.text.strip():
                parts[name].append(text_node.text.strip())

if not parts:
    print('NO_TEXT_FOUND')
    sys.exit(0)

for name in sorted(parts):
    texts = parts[name]
    print(f'## {name} ({len(texts)} text nodes)')
    last = None
    for text in texts:
        if text != last:
            print(text)
        last = text
    print()
