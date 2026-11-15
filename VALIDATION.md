# Release validation

## v1.2.0 — 2026-11-14

- 007 monitor-band and 008 readable-terminal portable examples completed actual 24-frame exports at their original timeline positions; layout, timing, BT.709 metadata, timestamps and full decode checks passed.
- Six existing configurations passed portable regression checks: monitor, network, cracks, terminal, training and logs-only.
- Both full-length v02 sample videos were copied byte-for-byte from the approved, previously encoded and validated local samples. All 12 earlier public previews remain unchanged.
- Both skill packages passed metadata, Python/JavaScript syntax, bundled font license and shared-runtime checks. Public text was scanned for private paths and common credential patterns; no matches.
- Tested on Windows with Chrome and FFmpeg discovered through environment variables. macOS/Linux full rendering remains unverified.

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
