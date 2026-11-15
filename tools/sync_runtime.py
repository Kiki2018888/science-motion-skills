"""Check bundled runtime copies; --apply updates all numbered skills from shared/."""
from pathlib import Path
import argparse, shutil
p=argparse.ArgumentParser();p.add_argument('--apply',action='store_true');a=p.parse_args()
root=Path(__file__).resolve().parents[1]
for skill in sorted((root/'skills').iterdir()):
    if not skill.is_dir():continue
    for source,relative in [('motion_render.py','scripts/motion_render.py'),('rendering.md','references/rendering.md')]:
        src=root/'shared'/source;dst=skill/relative
        if a.apply:shutil.copy2(src,dst)
        assert dst.read_bytes()==src.read_bytes(),str(dst)
print('All shared runtime and documentation copies match.')
