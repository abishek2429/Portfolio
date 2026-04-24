from zipfile import ZipFile
import sys
from pathlib import Path

path = Path(sys.argv[1])
with ZipFile(path) as z:
    for name in z.namelist():
        print(name)
