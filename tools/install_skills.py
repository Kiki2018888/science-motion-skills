"""Install all numbered skills; existing destinations are never overwritten."""
import argparse
import os
from pathlib import Path
import shutil

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--destination',type=Path,default=Path(os.environ.get('CODEX_HOME',Path.home()/'.codex'))/'skills')
    ap.add_argument('--dry-run',action='store_true')
    a=ap.parse_args();source=Path(__file__).resolve().parents[1]/'skills';items=sorted(source.iterdir());dest=a.destination.expanduser().resolve()
    collisions=[p.name for p in items if (dest/p.name).exists()]
    if collisions:ap.error('Existing skills will not be overwritten: '+', '.join(collisions))
    for p in items:
        print(str(dest/p.name))
    if not a.dry_run:
        dest.mkdir(parents=True,exist_ok=True)
        for p in items:shutil.copytree(p,dest/p.name)
    print('Planned' if a.dry_run else 'Installed',len(items),'skills')

if __name__=='__main__':main()
