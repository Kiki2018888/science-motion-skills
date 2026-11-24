# Release validation

## v1.10.0 — standalone publication of 019

- A clean installation of the collection produced the eleven directories in the catalog. All 26 removed package files belonged to 019. The other skill directories matched the preceding main revision.
- The standalone repository preserved the three earlier skill commits. An anonymous clone passed the skill validator, listed twenty styles, built an offline two-style scene, and exported a selected 960×540 frame in Chrome.
- The standalone Pages branch contains one HTML file. Its published bytes matched the packaged badminton showcase, and a browser rendered the 1920×1080 canvas and switched styles.

## v1.9.0 — 2026-11-24

- Built two independent inputs, a 960×540 paper boat and a 480×640 cam follower, as local HTML files, each with all 20 styles. Offline Chromium made no network requests. Every style drew distinct frames and repeated seeks reproduced identical PNGs.
- Verified the boat's bow and line-end at release, and the cam, follower and stamp contacts. Canvas coordinates matched across all styles at the four sampled times per input.
- An independent agent authored another action from text: a snail extended a feeler, touched a drop of dew, and withdrew. The woodblock and oscilloscope views retained nine anchors at twelve sampled times. Named CLI frame export matched the manually selected oscilloscope frame pixel-for-pixel in the same Chrome rendering configuration.
- Exported the entire nine-second boat animation using the authored-HTML entry point. FFprobe reported H.264, yuv420p, 960×540, 30 fps, 270 frames and 9.000 seconds.

## v1.8.0 — 2026-11-22

- Installed the numbered 019 package in an empty directory and validated its manifest, required files, upstream pin and JavaScript syntax.
- Opened the single-file showcase offline in Chrome. At five rally times in each of the twenty scenes, all 100 full-resolution RGBA frames matched their individual source scenes. The viewer made no HTTP requests.
- Exercised same-frame style changes, scrubbing, audio, sequential playback, single-scene looping, fullscreen, credits and all twenty touch selectors. Desktop and mobile layouts were tested at 1440 × 900 and 390 × 844.
- Verified that all four edges of the original woodblock frame remain visible in five viewport sizes, including phone landscape and portrait.
- Started the packaged preview server on loopback and used the packaged capture command to produce two identical stills and a six-frame, 1920 × 1080 H.264 clip. The published skill includes the upstream license, original notices and links to the pinned source.

## v1.7.0 — 2026-11-21

- Skill 018 rendered the magnet scene in landscape and portrait (228 frames each) and the sticker scene in landscape (102 frames). The two public previews use the landscape configurations. The renderer checked frame count, timestamps, BT.709 metadata and full decoding at 30 fps.
- An independent use of the packaged renderer created a portrait pinwheel scene with new vector artwork, a hand attachment and captions. All 96 frames decoded. The offline player loaded locally and reproduced the same pixels when seeking back to a frame.

## v1.6.0 — 2026-11-18

- Installed the public packages into a fresh directory on Windows. The seven v3.0.0 skills rendered an eight-frame H.264 clip for each of the 12 showcase configurations. The other 25 bundled examples passed their browser and timeline checks, including the video comparison, half-phone, monitor band, wrapped terminal and pixel race.
- All 12 full-length MP4 previews matched the local showcase files by SHA-256 and decoded through the last frame. Three original timeline frames per preview were compared against fresh renders. The largest mean absolute difference per RGB channel after 4× downsampling was 2.20 on a 0–255 scale.
- Each renderer exported a four-frame VP9 WebM. All seven sample canvases filled the frame, with first-frame alpha values of 255 throughout. Each CLI rejected both mismatched file extensions before creating output.
- The catalog, README and gallery point to the current previews. The package removes the 11 superseded videos for 003–009. All 20 shared source and documentation copies matched the renderer versions in the catalog.

## v1.5.0 — 2026-11-17

- The portable 001 and 002 renderers completed six short exports on Windows using Chrome and FFmpeg. These covered a portrait X conversation, a transparent mixed-mode chat, all three v3 flow layouts and a transparent flow overlay. Frame counts, dimensions, timestamps, layout, seeking and full video decoding passed.
- Both VP9 WebM files contained the alpha-mode flag. The decoded first alpha plane spanned 0–255 in each clip. The requested PNGs also contained transparent and opaque pixels. Both CLIs rejected mismatched output extensions before writing output.
- All four previous 002 example configurations passed layout, cursor and timeline checks with the v3 renderer. The three new 11.5-second preview videos matched their source files by SHA-256. Each decoded as 276 frames at 24 fps. Frame 204 of each preview was also compared with output from its published JSON configuration.
- The 94.5-second seven-UI 001 preview matched the original by SHA-256 and decoded in full. The Codex installer was exercised in a fresh destination, and both skills passed metadata validation. All 20 renderer and documentation copies matched the version selected by the catalog.
- Full video rendering was tested on Windows. macOS and Linux remain unverified for this release.

## v1.4.1 — 2026-11-17

- Removed the retired 001 four-layout templates, minimal example and original preview from the current package and gallery. The current package supports only the seven approved UI themes; removed UI options fail validation instead of silently selecting another design.
- The cleaned public package passed all 56 UI combinations, 14 mixed long-dialogue cases and seven bundled-font fallback cases. All 28 portrait final frames still match the approved baseline; typing is cursor-free.
- The installed package completed a full 144-frame, six-second dark landscape export with both type and pop messages. Dimensions, timestamps, BT.709 metadata and full decoding passed. Audio remains absent.
- Local, installed and portable public packages contain the same 23 files; the public skill instructions omit only project-specific paths. The approved v02 preview, other skill packages and shared runtime are unchanged. Local and public preview links were checked, with no broken links.
- Metadata, structure, Python syntax, JSON, licenses, shared-runtime consistency and private-path scanning passed. Earlier sections describe historical releases, including features removed in this cleanup.

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
