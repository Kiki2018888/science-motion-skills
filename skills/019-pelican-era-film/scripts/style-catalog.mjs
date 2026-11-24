import { readFileSync } from 'node:fs';

export const cards = JSON.parse(readFileSync(new URL('../assets/medium/styles.json', import.meta.url), 'utf8'));

const normalize = (s) =>
  String(s)
    .trim()
    .toLowerCase()
    .replace(/[\s_·-]/g, '');
export function chooseStyle(name) {
  const key = normalize(name).replace(/(?:的)?(?:画风|风格|风)$/, '');
  const card = cards.find((c) =>
    [c.id, c.number, String(c.number).padStart(2, '0'), c.name, ...c.aliases].some(
      (v) => normalize(v) === key,
    ),
  );
  if (!card) throw new Error('找不到画风「' + name + '」。用 list 查看名称或编号。');
  return card;
}
