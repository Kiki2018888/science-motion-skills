# Release validation

- Nine numbered skills passed metadata and package checks.
- All nine portable renderers passed `--check-only` with bundled example configurations on Windows, Python 3.12.10, Playwright 1.65.1 and Pillow 13.0.0.
- Browser loading, layout/timing and deterministic seek checks were run according to each renderer. These checks do not encode new MP4s.
- Included preview MP4s were copied unchanged from the previously validated original renders.
- Public text files were scanned for private machine paths and common credential patterns; no matches.
- Runtime executables and private project documents are excluded.
- macOS and Linux full rendering has not been verified.
