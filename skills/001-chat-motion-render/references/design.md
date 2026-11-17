# UI 设计依据与字体

七套界面是用于动画演示的独立 HTML/CSS 重绘，未分发产品的官方 UI 素材、官方字体或 SF Symbols，也不是产品实际录屏。名称仅标识对应视觉风格，不表示关联或授权。图标、头像和 WhatsApp 淡纹理为本模板绘制。

参考入口：
- Apple Human Interface Guidelines：[材料](https://developer.apple.com/design/human-interface-guidelines/materials)、[排版](https://developer.apple.com/design/human-interface-guidelines/typography)。玻璃近似主要用于导航、操作层，正文保持清晰。
- [WeChat 官方商店页面](https://apps.apple.com/us/app/wechat/id414478124)：灰底、方形头像和绿白气泡。
- [WhatsApp 官方主题介绍](https://blog.whatsapp.com/chat-themes-to-reflect-your-style)：壁纸、消息时间与双勾。
- [Claude 官方 iOS 介绍](https://claude.com/resources/articles/team-plan-and-ios)：暖白提问卡和无框回答。
- [ChatGPT 官方展示](https://chatgpt.com/overview/)：黑白灰提问卡、回答和反馈工具栏。
- [X 官方对话说明](https://help.x.com/en/using-x/x-conversations)：公开主帖、回复关系与互动栏；本模板不是私信。
- [Gemini 官方介绍](https://blog.google/innovation-and-ai/products/gemini-app/next-evolution-gemini-app/)：浅蓝提问卡、星芒与工具区。

字体优先使用系统可用字体，包括已安装的 MiSans；未在包内分发这些系统字体。缺失时回退到 assets/template/body.otf（Adobe Source 中文字体），随原 SIL OFL 1.1 许可分发。跨系统字形、字宽可略有差异，仍需检查换行与可见性。普通图标、控制条和英文标识使用系统回退字体。

公开代表样片为用户认可的 94.5 秒七套 UI 对比，左逐字、右整条弹出，无光标、无声。样片使用 Windows 本机已安装字体；单界面可按 assets/examples/ 的 JSON 导出。正式技能不含音效生成或混音。
