# Search Widget

A lightweight, macOS Spotlight-inspired search bar for Windows. Fast, minimal, and always accessible with a global keyboard shortcut.


## ✨ Features

- 🚀 **Lightning Fast** - Instant access with `Alt+Space`
- 🎨 **Beautiful UI** - Modern glassmorphism design with smooth animations
- 🌓 **Theme Support** - Dark, Light, and Violet themes
- 🔗 **Custom Shortcuts** - Create website and app shortcuts
- 🔍 **Web Search** - Quick Google search from anywhere
- 💾 **Persistent Settings** - Your preferences are saved automatically
- 🖥️ **System Tray** - Runs quietly in background
- 🚀 **Auto-Start** - Optional startup with Windows


## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Search-Widget.git
cd Search-Widget

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Package as executable
npm run package
```

## ⌨️ Usage

| Action | Shortcut |
|--------|----------|
| Open Search Bar | `Alt+Space` |
| Search Web | Type and press `Enter` |
| Close | `Escape` |
| Open Settings | Type `:settings` |

### Custom Shortcuts

Create shortcuts for quick access:

- **Website shortcuts**: Type `yt` → Opens YouTube
- **App shortcuts**: Type `valo` → Launches Valorant

Add shortcuts via `:settings` → Kısayollar tab.

## 🛠️ Tech Stack

- **Framework**: Electron
- **Frontend**: React + TypeScript
- **Styling**: SCSS with CSS Variables
- **Build Tool**: Vite
- **Storage**: electron-store

## 📁 Project Structure

```
Search-Widget/
├── src/
│   ├── main/           # Electron main process
│   │   ├── main.ts     # App entry, window, tray
│   │   ├── preload.ts  # IPC bridge
│   │   ├── shortcuts.ts # Shortcut manager
│   │   └── settings.ts  # Settings manager
│   └── renderer/       # React frontend
│       ├── components/ # React components
│       ├── styles/     # SCSS files
│       └── types/      # TypeScript definitions
├── assets/            # Icons and images
└── dist/              # Built files
```

## 🎨 Customization

### Themes

Three built-in themes available in settings:
- 🌙 **Dark** - Default dark theme
- ☀️ **Light** - Clean light theme  
- 💜 **Violet** - Purple accent theme

### Global Shortcut

Change the activation shortcut in settings:
- `Alt+Space` (default)
- `Ctrl+Space`
- `Ctrl+Shift+Space`
- `Alt+S`
- `Ctrl+Alt+Space`

## 📄 License

MIT License - feel free to use and modify.

---

> **Note**: The code comments and performance optimizations of this project were assisted and refined using artificial intelligence tools to improve readability, maintainability, and overall code quality.