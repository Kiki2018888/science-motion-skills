#!/usr/bin/env bash
# 把固定提交的 pelican-test 检出到用户指定的新目录。
# 不删除已有文件，不运行 pnpm/npm，不运行上游 tools/ 脚本。
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
SKILL_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
PIN_FILE="$SKILL_ROOT/assets/upstream-pin.json"

usage() {
  cat <<'EOF'
用法:
  scripts/fetch-upstream.sh [--full | --skip-source-fonts] <目标目录>

目标目录必须不存在，或者是空目录。脚本不会清空、覆盖或重置已有工程。
默认 --full：检出固定提交的完整树，含 public/fonts/*.ttf。
--skip-source-fonts：不下载 *.ttf。播放器会使用同目录的 woff2。OFL 义务仍在。

环境变量:
  PELICAN_UPSTREAM_URL     覆盖 pin 文件中的 git URL
  GIT_TERMINAL_PROMPT=0    由脚本设置，避免交互式询问密码

成功后打印提交哈希、许可文件路径，并明确说明没有安装依赖。
EOF
}

MODE="full"
DEST=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --full)
      MODE="full"
      shift
      ;;
    --skip-source-fonts)
      MODE="preview-fonts"
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    --)
      shift
      break
      ;;
    -*)
      echo "未知参数: $1" >&2
      usage >&2
      exit 2
      ;;
    *)
      if [[ -n "$DEST" ]]; then
        echo "只能指定一个目标目录。" >&2
        exit 2
      fi
      DEST="$1"
      shift
      ;;
  esac
done

if [[ -z "$DEST" ]]; then
  echo "必须显式指定目标目录。例如: scripts/fetch-upstream.sh \"\$HOME/work/pelican-test\"" >&2
  exit 2
fi

if [[ ! -f "$PIN_FILE" ]]; then
  echo "缺少 pin 文件: $PIN_FILE" >&2
  exit 2
fi

PIN_URL=$(node -e "const p=require(process.argv[1]); if(!p.url||!p.commit) process.exit(3); process.stdout.write(p.url)" "$PIN_FILE")
PIN_COMMIT=$(node -e "const p=require(process.argv[1]); process.stdout.write(p.commit)" "$PIN_FILE")
URL="${PELICAN_UPSTREAM_URL:-$PIN_URL}"

if [[ ! "$PIN_COMMIT" =~ ^[0-9a-f]{40}$ ]]; then
  echo "pin 文件中的提交哈希无效。" >&2
  exit 2
fi

PARENT=$(dirname -- "$DEST")
if [[ ! -d "$PARENT" ]]; then
  echo "父目录不存在，脚本不会自动逐级创建: $PARENT" >&2
  exit 2
fi
PARENT_ABS=$(cd -- "$PARENT" && pwd)
DEST_ABS="$PARENT_ABS/$(basename -- "$DEST")"

case "$DEST_ABS" in
  "$SKILL_ROOT"|"$SKILL_ROOT"/*)
    echo "拒绝把上游检出到技能目录内部: $DEST_ABS" >&2
    exit 2
    ;;
esac

CREATED=0
if [[ -e "$DEST_ABS" ]]; then
  if [[ ! -d "$DEST_ABS" ]]; then
    echo "目标已存在且不是目录: $DEST_ABS" >&2
    exit 2
  fi
  if [[ -n "$(ls -A "$DEST_ABS")" ]]; then
    echo "目标非空，已拒绝覆盖: $DEST_ABS" >&2
    echo "换一个新路径。本脚本不会删除里面的文件。" >&2
    exit 2
  fi
else
  mkdir -- "$DEST_ABS"
  CREATED=1
fi

TMP=$(mktemp -d "${TMPDIR:-/tmp}/pelican-fetch.XXXXXX")
cleanup() {
  rm -rf "$TMP"
}
trap cleanup EXIT

export GIT_TERMINAL_PROMPT=0

echo "检出 $URL"
echo "提交 $PIN_COMMIT"
echo "模式 $MODE"
echo "目标 $DEST_ABS"

git -C "$TMP" init -q -b main
git -C "$TMP" remote add origin "$URL"
if [[ "$MODE" == "preview-fonts" ]]; then
  git -C "$TMP" sparse-checkout init --no-cone
  git -C "$TMP" sparse-checkout set --no-cone '/*' '!public/fonts/*.ttf'
  git -C "$TMP" fetch --filter=blob:none --depth 1 origin "$PIN_COMMIT"
else
  git -C "$TMP" fetch --depth 1 origin "$PIN_COMMIT"
fi
git -C "$TMP" checkout --detach --quiet FETCH_HEAD

HEAD=$(git -C "$TMP" rev-parse HEAD)
if [[ "$HEAD" != "$PIN_COMMIT" ]]; then
  echo "检出结果是 $HEAD，与 pin 不一致，已放弃。" >&2
  if [[ "$CREATED" == 1 ]]; then
    rmdir "$DEST_ABS" 2>/dev/null || true
  fi
  exit 1
fi

for required in LICENSE THIRD_PARTY_NOTICES.md package.json index.html render.html src/main.js src/beat/timeline.js src/scenes/s01_sahara.js src/scenes/s20_code.js public/vendor/p5.min.js public/vendor/p5.brush.js public/fonts/NotoSerifSC.woff2; do
  if [[ ! -f "$TMP/$required" ]]; then
    echo "固定树缺少必要文件: $required" >&2
    exit 1
  fi
done

shopt -s dotglob
mv "$TMP"/* "$DEST_ABS"/
shopt -u dotglob

echo "已写到 $DEST_ABS"
echo "HEAD $(git -C "$DEST_ABS" rev-parse HEAD)"
echo "许可 $DEST_ABS/LICENSE"
echo "第三方 $DEST_ABS/THIRD_PARTY_NOTICES.md"
echo "没有运行 pnpm install、npm install，也没有运行上游 tools/ 下的脚本。"
echo "下一步如需截帧，先在该目录自行安装依赖或只使用本技能的无依赖截帧脚本。见 SKILL.md。"
