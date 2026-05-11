<div align="center">
  <img src="icon128.png" alt="Logo" width="80" height="80">
  <h1>Gemini Context Navigator</h1>
  <p><b>让长对话不再迷路。</b>专为 Google Gemini 设计的沉浸式侧边导航扩展。</p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Version](https://img.shields.io/badge/Version-1.0.0-blue.svg)]()
</div>

---

在使用 Gemini 进行长篇编程辅助、文章写作或深度学习时，我们经常会面临“无限滚动”带来的困扰：想回顾之前的提问却要反复拖动滚动条、忘记了当前阅读的上下文、找不到跨轮次对话的锚点。

**Gemini Context Navigator** 是一个轻量级、零侵入的 Chrome 扩展，能自动将线性的对话流转化为**结构化的目录**。

> 💡 **设计理念**：采用磨砂玻璃风格的现代化 UI，像原生组件一样“生长”在你的浏览器边缘，只在你需要的时候出现。

<br>

<div align="center">
  <!-- 📷 截图占位符 1：放一张带有复杂长对话背景，同时展开侧边栏目录的全屏截图 -->
  <img width="600" alt="show1" src="https://github.com/user-attachments/assets/ff68afc9-11fb-4ced-990b-e7402e244a63" />
  <p><i>自动提取对话节点，生成平滑跳转的智能侧栏</i></p>
</div>

<br>

## ✨ 核心功能 (Features)

*   📑 **智能目录 (Smart TOC)**：自动提取每一轮对话的用户提问，生成清晰的侧边导航栏。
*   ⚡ **点击跳转 (Quick Jump)**：点击目录项，页面瞬间平滑滚动至目标位置。
*   🪟 **原生体验 (Native Look)**：专为 Light Mode 优化的磨砂白配色，细腻的交互动画与阴影细节。

<br>

<div align="center">
  <!-- 📷 GIF占位符 1：录制一个 5 秒左右的 GIF，演示“鼠标悬停/点击边缘悬浮球展开侧边栏”，以及“拖拽悬浮球吸附到屏幕另一侧”的丝滑动画 -->
  <img width="600"  alt="show2" src="https://github.com/user-attachments/assets/f0ad2486-85cb-47bc-9bd5-2ee829243d20" />

  <p><i>灵动悬浮球：支持自由拖拽与智能边缘吸附</i></p>
</div>

<br>

### 🛠 快捷控制台 (Quick Actions)

除了全局目录，扩展还在屏幕右下角提供了贴边控制条，方便在沉浸阅读时进行极速操作：
*   **一键跳转**：`上一条` / `下一条` 对话
*   **极速直达**：`顶部` / `底部`

## 🚀 安装指南 (Installation)

1.  **下载代码**：Clone 本仓库或下载 ZIP 包并解压。
2.  **打开扩展管理**：在 Chrome 地址栏输入 `chrome://extensions/`。
3.  **开启开发者模式**：打开右上角的 `Developer mode` 开关。
4.  **加载扩展**：点击左上角的 `Load unpacked` (加载已解压的扩展程序)，选择本项目文件夹 `src/`。
5.  **开始使用**：打开 [Gemini](https://gemini.google.com/) 即可体验。

## 📂 项目结构 (Project Structure)

```text
.
├── manifest.json                 # Chrome Extension Manifest V3 配置
├── style.css                     # 全局样式与主题变量（含暗黑模式适配）
└── src/
    ├── content.js                # 扩展入口：初始化、Observer、滚动同步
    ├── config/config.js          # 选择器配置、默认设置、标题清洗前缀
    ├── utils/utils.js            # 通用工具：防抖、节流、哈希、文本清洗
    ├── services/storage.js       # Chrome storage 设置读取
    ├── features/
    │   ├── domScanner.js         # 对话扫描、变更检测、目录数据构建
    │   └── scroll.js             # 页面滚动、定位当前消息、上下跳转
    └── ui/ui.js                  # 侧边栏、悬浮球、Pinned、快捷操作 UI
