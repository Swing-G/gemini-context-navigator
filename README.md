# Gemini Context Navigator (Gemini 长对话导航助手)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **让长对话不再迷路。**  
> 专为 Google Gemini 设计的沉浸式侧边导航扩展，提供原生的阅读体验。

## ✨ 产品简介 (Introduction)

在使用 Gemini 进行长篇编程辅助、文章写作或深度学习时，我们经常会面临“无限滚动”带来的困扰：
*   想回顾之前的某个 Prompt，却要在漫长的对话流中反复拖动滚动条。
*   忘记了当前阅读的位置在对话的哪个阶段。
*   想要快速在上下文之间切换，却找不到锚点。

**Gemini Context Navigator** 完美解决了这些问题。它是一个轻量级、零侵入的 Chrome 扩展，能自动将线性的对话流转化为**结构化的目录**。它采用磨砂玻璃风格的现代化 UI，像原生组件一样“生长”在你的浏览器边缘，只在你需要的时候出现。

## 🚀 核心功能 (Features)

*   **智能目录 (Smart TOC)**：自动提取每一轮对话的用户提问，生成清晰的侧边导航栏。
*   **点击跳转 (Quick Jump)**：点击目录项，页面瞬间平滑滚动至目标位置。
*   **灵动悬浮球 (Floating Toggle)**：
    *   可拖拽的悬浮按钮，支持自动吸附屏幕左右边缘。
    *   **智能侧栏**：根据吸附位置自动判断侧边栏展开方向，永不遮挡内容。
    *   **极简设计**：默认收起，鼠标悬停或点击即刻展开，用完即走。
*   **快捷控制台 (Quick Actions)**：
    *   位于屏幕右下角的贴边控制条。
    *   一键跳转：`上一条` / `下一条` 对话。
    *   极速直达：`顶部` / `底部`。
*   **原生体验 (Native Look & Feel)**：
    *   专为 Light Mode 优化的**磨砂白**配色，搭配主题粉色高亮。
    *   细腻的交互动画与阴影细节，带来丝般顺滑的操作手感。

## 🛠️ 安装指南 (Installation)

1.  **下载代码**：Clone 本仓库或下载 ZIP 包并解压。
2.  **打开扩展管理**：在 Chrome 地址栏输入 `chrome://extensions/`。
3.  **开启开发者模式**：打开右上角的 `Developer mode` 开关。
4.  **加载扩展**：点击左上角的 `Load unpacked` (加载已解压的扩展程序)，选择本项目文件夹。
5.  **开始使用**：打开 [Gemini](https://gemini.google.com/)，即可体验。

## 📖 使用说明 (Usage)

1.  **展开导航**：鼠标悬停或点击屏幕边缘的悬浮按钮（默认为右侧 `☰` 图标）。
2.  **浏览历史**：在展开的侧边栏中查看对话历史，点击标题即可跳转。
3.  **调整位置**：按住悬浮按钮可随意拖拽，松手后自动吸附至最近的屏幕边缘。
4.  **快捷跳转**：使用右下角的控制条快速切换上下文。

## 📂 项目结构 (Project Structure)

```text
.
├── manifest.json   # Chrome Extension V3 配置
├── content.js      # 核心逻辑 (DOM 监听, 滚动计算, 交互逻辑)
├── style.css       # 样式表 (CSS Variables, 动画, 布局)
├── icon128.png     # 插件图标 (需自行添加)
└── README.md       # 项目文档
```

## 📄 License

This project is licensed under the MIT License.
