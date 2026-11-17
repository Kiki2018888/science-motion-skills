# Release validation

## v1.4.0 — 2026-11-17

- 001 modern UI passed 56 combinations: seven themes, portrait/landscape, light/dark and type/pop. All 28 portrait final-state renders match the approved static UI at pixel level; typing remains cursor-free. Mixed long-dialogue scrolling passed for all seven themes in both orientations.
- Eight legacy layout cases and seven forced bundled-OFL-font cases passed. Random seeking, message completeness, clipping and browser error checks passed.
- The portable public renderer completed a full 324-frame, 13.5-second X thread export. The installed package also completed a 30-frame export at 30fps from frames 15–44 of an independently authored dark landscape mixed-mode configuration. Both passed BT.709 metadata, dimensions, timestamps and full decoding.
- The 94.5-second seven-theme comparison preview is byte-identical to the approved local no-cursor v02. All 15 earlier public preview videos and the other nine skill packages remain unchanged.
- Skill metadata, package structure, Python syntax, JSON examples, licenses and shared-runtime consistency passed. New public files were scanned for private machine paths and common credential patterns, with no matches.
- This release remains silent: no sound effects, audio generation or mixing are included. Product UI is independently redrawn; proprietary product assets, system fonts and runtime binaries are not bundled.
- Tested on Windows with Chrome and FFmpeg. Full macOS/Linux rendering remains unverified.

## v1.3.0 — 2026-11-15

- New 011 freeform renderer completed an actual 30-frame export from original frames 90–119 using CHROME_BIN and FFMPEG_BIN dependency discovery. Layout, 60 timeline inspections, random seek state/pixel checks, BT.709 metadata, timestamps and full decode passed.
- The full 50-second preview was copied byte-for-byte from the approved and validated local v2 sample. All 14 earlier public videos and all nine existing skill packages remain unchanged.
- Local v2 testing covered independent card geometry, cubic paths, focus expansion, group transforms, scene boundaries, pause/scrub controls, an independently authored three-card composition and legacy dashboard compatibility. Technical validation does not imply all possible content combinations were tested.
- Package metadata, Python/JavaScript syntax, JSON examples, font license and all ten shared runtime copies passed checks. New public text was scanned for private machine paths and common credential patterns, with no matches.
- Original implementation and procedural illustrations retain MIT licensing; the Adobe Source font retains SIL OFL 1.1. Private user documents and production records are excluded.
- Tested on Windows. macOS/Linux full rendering remains unverified.

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
