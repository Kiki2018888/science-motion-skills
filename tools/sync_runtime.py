"""Verify or sync the renderer version selected for each skill in catalog.json."""
import argparse
import json
from pathlib import Path
import shutil


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    catalog = json.loads((root / 'catalog.json').read_text(encoding='utf-8'))
    default_version = catalog['shared_renderer_version']
    copies = 0
    for skill in catalog['skills']:
        version = skill.get('shared_renderer_version', default_version)
        shared = root / 'shared'
        if version != default_version:
            shared = shared / version
        for relative in (Path('scripts/motion_render.py'), Path('references/rendering.md')):
            source = shared / relative.name
            target = root / skill['path'] / relative
            if not target.is_file() or target.read_bytes() != source.read_bytes():
                if not args.apply:
                    raise SystemExit(f'{target} differs from {source}')
                shutil.copy2(source, target)
            copies += 1
    print(f'All {copies} shared runtime and documentation copies match.')


if __name__ == '__main__':
    main()
