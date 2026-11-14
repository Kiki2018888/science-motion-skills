"""Discover local render tools without machine-specific project paths."""
import os
from pathlib import Path
import shutil

def default_chrome():
    override=os.environ.get('CHROME_BIN')
    if override:
        return Path(override).expanduser()
    for name in ['google-chrome','chromium','chromium-browser','chrome','msedge']:
        found=shutil.which(name)
        if found:return Path(found)
    candidates=[]
    for env in ['PROGRAMFILES','PROGRAMFILES(X86)','LOCALAPPDATA']:
        if os.environ.get(env):
            root=Path(os.environ[env])
            candidates.extend([root/'Google/Chrome/Application/chrome.exe',root/'Microsoft/Edge/Application/msedge.exe'])
    candidates.append(Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'))
    for p in candidates:
        if p.is_file():return p
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            executable=Path(p.chromium.executable_path)
        if executable.is_file():return executable
    except ImportError:
        pass
    return Path('__chrome_not_found__')

def default_ffmpeg():
    return Path(os.environ.get('FFMPEG_BIN') or shutil.which('ffmpeg') or '__ffmpeg_not_found__').expanduser()
