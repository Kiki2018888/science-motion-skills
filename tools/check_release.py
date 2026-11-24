"""Offline structural validation; does not encode or claim visual validation."""
import ast
import json
from pathlib import Path
import re

def main():
    root=Path(__file__).resolve().parents[1];catalog=json.loads((root/'catalog.json').read_text(encoding='utf-8'))
    for item in catalog['skills']:
        skill=root/item['path'];text=(skill/'SKILL.md').read_text(encoding='utf-8')
        assert re.search(r'^name: '+re.escape(item['name'])+r'$',text,re.M),item['name']
        font_mode=item.get('font_mode','bundled')
        assert font_mode in ('bundled','system'),item['name']
        if font_mode=='bundled':
            assert (skill/'assets/template/OFL.txt').is_file()
            assert (skill/'assets/template/body.otf').is_file()
        if 'default_preview' in item:
            assert (root/item['default_preview']).is_file(),item['default_preview']
        assert (skill/'agents/openai.yaml').is_file()
    packaged = {item['path'] for item in catalog['skills']}
    on_disk = {skill.relative_to(root).as_posix() for skill in (root/'skills').iterdir() if skill.is_dir()}
    assert on_disk == packaged, 'Catalog and installable skill directories disagree'
    numbers = [item['number'] for item in catalog['skills']]
    numbers.extend(catalog.get('retired_numbers', []))
    numbers.extend(item['number'] for item in catalog.get('moved_skills', []))
    assert len(numbers) == len(set(numbers)), 'A skill number was assigned twice'
    assert catalog['next_number'] == max(map(int, numbers)) + 1
    for p in root.rglob('*.py'):
        if '.venv' not in p.parts:ast.parse(p.read_text(encoding='utf-8-sig'),filename=str(p))
    for p in (root/'skills').rglob('*.json'):json.loads(p.read_text(encoding='utf-8-sig'))
    for item in catalog['previews']:assert (root/item['video']).is_file()
    assert (root/'LICENSE').is_file() and (root/'THIRD_PARTY_NOTICES.md').is_file()
    print('Structure, Python syntax, JSON examples, preview files and license notices passed.')

if __name__=='__main__':main()
