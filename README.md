# MochiNekoMusic

一款基于 Tauri 2、React 和 TypeScript 构建的桌面音乐播放器。

## 功能特性

- **本地音乐库** - 浏览和播放本地音乐收藏
- **音频播放** - 支持完整的播放控制（播放/暂停、上一曲/下一曲、进度拖拽）
- **播放模式** - 支持顺序播放、单曲循环、列表循环、随机播放
- **歌词显示** - 行内同步歌词（LRC 格式）
- **在线搜索** - 搜索并下载在线音乐
- **系统托盘** - 后台播放，托盘图标快捷控制
- **自定义标题栏** - 无边框窗口，支持拖拽的标题栏
- **低资源占用** - 优化 GPU 和内存使用，确保流畅运行

## 技术栈

- **前端**: React 19 + TypeScript + Tailwind CSS v4
- **后端**: Tauri 2 (Rust)
- **状态管理**: Zustand
- **音频元数据**: lofty (Rust)

## 开发

### 环境要求

- Node.js 18+
- Rust 1.70+
- npm

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run tauri dev
```

### 构建生产版本

```bash
npm run tauri build
```

## 项目结构

```
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── common/         # 通用组件（TitleBar、Button 等）
│   │   ├── library/        # 侧边栏、媒体库导航
│   │   ├── player/         # PlayerBar、InlineLyrics
│   │   └── playlist/       # SongList、OnlineSearch
│   ├── stores/             # Zustand 状态管理
│   ├── services/           # API 服务
│   └── lib/                # 工具函数
├── src-tauri/              # Rust 后端
│   └── src/
│       ├── commands/       # Tauri 命令
│       ├── audio/          # 音频播放
│       └── db/             # SQLite 数据库
├── lyrics/                 # 歌词处理脚本
└── public/                 # 静态资源
```

## 许可证

MIT
