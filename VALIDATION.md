# Release validation

## v1.1.0 — 2026-11-14

- Nine portable renderers completed real short exports of original frames 24–35, plus PNG previews, with frame counts, timestamps, BT.709 encoding and full decode checks.
- 002 used continuous-loop.json, 005 half-phone.json, and 009 pixel-race.json. The remaining renderers used existing examples (001 used a small two-message configuration).
- Runtime discovery was exercised using CHROME_BIN and FFMPEG_BIN. Tests ran on Windows; macOS/Linux rendering remains unverified.
- Three full-length v02 preview videos were copied byte-for-byte from their validated, visually reviewed originals. All nine earlier preview videos remain byte-identical.
- Source packages passed structural, Python syntax, JSON, JavaScript syntax and shared-runtime consistency checks. Public text was scanned for private machine paths and common credential patterns; no matches.
- Original code and examples retain MIT licensing. Font files retain their bundled SIL OFL 1.1 notices. Runtime executables and private production projects are excluded.
- 007 / 008 receive only the common-renderer update in this release; unreleased template experiments are excluded.

## v1.0.0

- Nine numbered skills passed metadata and package checks, and all nine portable renderers passed --check-only on Windows.
- Included original preview MP4s were copied unchanged from previously validated renders.
