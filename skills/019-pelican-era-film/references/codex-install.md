# 安装到 Codex

下列路径用于 Codex。DeepSeek Harness 的安装方式尚未验证。

## 技能是什么

Codex 使用开放的 Agent Skills 格式。一个技能是一个目录，里面必须有 `SKILL.md`。官方说明：

- 创建与发现：<https://learn.chatgpt.com/docs/build-skills>
- 自定义总览：<https://learn.chatgpt.com/docs/customization/overview>
- 格式约束：<https://agentskills.io/specification>

`SKILL.md` 开头的 YAML 必须含 `name` 与 `description`。`name` 只能用小写字母、数字和单个连字符，并且要和父目录名一致。Codex 启动时只看名称和描述；选中该技能后才读正文。描述要写清何时使用、何时不要使用。

## Codex 会扫描的位置

来源：<https://learn.chatgpt.com/docs/build-skills> 的 “Where Codex loads local skills”。同一 `name` 出现两份时不会合并，选择器里会同时看到。符号链接会跟着目标走。

| 范围 | 路径 | 用途 |
| --- | --- | --- |
| 仓库 | `$CWD/.agents/skills` | 从当前工作目录启动 Codex 时，给这个目录用 |
| 仓库 | 从当前目录往上，直到仓库根的每一层 `.agents/skills` | 嵌套目录共享的技能 |
| 仓库 | `$REPO_ROOT/.agents/skills` | 整个仓库都能用 |
| 用户 | `$HOME/.agents/skills` | 这个用户的所有仓库 |
| 管理员 | `/etc/codex/skills` | 这台机器或容器里的默认技能 |
| 系统 | 随 Codex 附带 | 含 `skill-creator` 与 `skill-installer` |

自定义总览把同一事实写成简表：仓库技能放 `.agents/skills`，个人技能放 `~/.agents/skills`。<https://learn.chatgpt.com/docs/customization/overview>

推荐安装（个人、所有仓库）：

```bash
mkdir -p "$HOME/.agents/skills"
cp -R skills/019-pelican-era-film "$HOME/.agents/skills/019-pelican-era-film"
test -f "$HOME/.agents/skills/019-pelican-era-film/SKILL.md"
```

推荐安装（只给当前仓库）：

```bash
mkdir -p .agents/skills
cp -R skills/019-pelican-era-film .agents/skills/019-pelican-era-film
```

把解压后的 `019-pelican-era-film` 目录放进去，不要多套一层同名目录。正确结果是目录里直接能看到 `SKILL.md`。

Codex 会自动发现变更。列表里没有它时，重开 Codex。

## 怎么调用

来源仍是上面的 Build skills 页：

- Codex CLI 或 IDE 扩展：输入 `/skills`，或用 `$019-pelican-era-film` 点名。
- 描述匹配时，Codex 也可以自己选中它。
- ChatGPT 桌面版：在支持技能的界面用 `@` 选择。独立技能可用于 ChatGPT 桌面版、Codex CLI 和 IDE 扩展。

关掉某一份而不删文件时，在 `~/.codex/config.toml` 写：

```toml
[[skills.config]]
path = "/绝对路径/019-pelican-era-film/SKILL.md"
enabled = false
```

同一条目只用一个选择器：绝对 `path` 对上一个文件，或 `name` 对上同名技能。改完配置后重开 Codex。来源：Build skills 的 “Enable or disable local Codex skills”。

## `$skill-installer` 的安装目录

随 Codex 附带的 skill-installer 把自己的安装目标写成 `$CODEX_HOME/skills`，默认是 `~/.codex/skills`。这是安装器脚本的行为，不是上面那张发现位置表里的推荐手写位置。来源：OpenAI Codex 仓库中的 `codex-rs/skills/src/assets/samples/skill-installer/SKILL.md`（main 分支，2026-11-23 读取）。

当前源码里，`$CODEX_HOME/skills` 仍作为旧的用户目录被扫描，注释写明为兼容保留；个人技能的新位置是 `$HOME/.agents/skills`。来源：`codex-rs/core-skills/src/loader.rs` 中 `skill_roots_from_layer_stack_inner`。手写安装请放进文档表中的 `.agents/skills`，不要只放进 `~/.codex/skills` 就当作官方推荐路径。

本技能没有发布到插件目录，也不要代用户执行 `$skill-installer` 去发布或安装它。

## 这份包不做什么

- 不修改 orbitoo/pelican-test，也不替用户开上游 pull request。
- 不在用户电脑上自动复制技能。上面的 `cp` 只有用户明确要求安装时才执行。
- 不发送外部消息，不创建插件上架。
- 未在 DeepSeek Harness 上安装或运行。目录布局遵循 Agent Skills 通用结构，方便以后改写安装说明，这不是兼容性测试结果。
