# 🎵 UniSound Desktop

> A modern, cross-platform desktop music player built with React and Electron. Stream music from online sources or enjoy your local music library with a beautiful, dynamic interface.

![UniSound](https://github.com/iamvany30/unisound-desktop/blob/main/UniSound.png?raw=true)

---

## ✨ Features

- 🎶 **Multiple Audio Format Support** - Play MP3, FLAC, OGG, WAV and more
- 🌐 **Online Streaming** - Stream music from various online sources
- 📁 **Local Library** - Organize and play your personal music collection
- 🎨 **Modern UI** - Beautiful, dynamic interface with smooth animations
- 🌈 **Color Extraction** - Dynamic color theming based on album artwork
- 🌍 **Multi-Language Support** - i18n support for multiple languages
- ⚙️ **Cross-Platform** - Works seamlessly on Windows, macOS, and Linux
- 💾 **Persistent Storage** - Remember your preferences and playlists
- 🚀 **Fast Performance** - Optimized with React and Electron
- 🔄 **Auto-Updates** - Automatic updates powered by electron-updater

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Desktop Framework**: Electron 38
- **State Management**: React Router, Context API
- **Styling**: Styled Components, Framer Motion (animations)
- **Audio**: HLS.js, Music Metadata
- **Storage**: SQLite (better-sqlite3), Electron Store
- **Build Tools**: React Scripts, Electron Builder
- **Build Process**: Tailwind CSS, PostCSS, Craco

---

## 📋 Requirements

- **Node.js**: v18.0.0 or higher
- **npm**: v7 or higher

---

## 🚀 Quick Start

### Installation

1. Clone the repository:
```bash
git clone https://github.com/iamvany30/unisound-desktop.git
cd unisound-desktop
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

### Development

Start the development server with Electron:
```bash
npm run dev
```

This command runs both the React development server and Electron app concurrently.

### Building

Build the application for your platform:
```bash
npm run dist
```

For release with auto-publishing:
```bash
npm run release
```

---

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start React development server |
| `npm run dev` | Start React + Electron in development mode |
| `npm run build:react` | Build React application |
| `npm run dist` | Build distributable desktop application |
| `npm run release` | Build and publish release with auto-update |
| `npm run clean` | Clean build directories |
| `npm run icons` | Generate application icons from logo |

---

## 📂 Project Structure

```
unisound-desktop/
├── src/                    # React source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── assets/            # Images, icons, logos
│   └── App.tsx            # Main App component
├── electron/              # Electron main process
├── public/                # Public static files
├── build/                 # Build output (generated)
├── dist/                  # Distribution files (generated)
├── assets/                # App icons and installer assets
├── package.json           # Project configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── craco.config.js        # Craco configuration
└── README.md              # This file
```

---

## 🎯 Supported Audio Formats

- **MP3** - MPEG Audio Layer III
- **FLAC** - Free Lossless Audio Codec
- **OGG** - Ogg Vorbis
- **WAV** - Waveform Audio File Format

---

## 🖥️ Platform Support

| Platform | Status | Format |
|----------|--------|--------|
| **Windows** | ✅ Supported | NSIS Installer |
| **macOS** | ✅ Supported | DMG Package |
| **Linux** | ✅ Supported | AppImage, DEB, RPM |

---

## 🔧 Configuration

### Electron Builder Configuration

The app is configured in `package.json` with the following settings:
- **App ID**: `com.unisound.app`
- **Product Name**: Unisound
- **Auto-Updates**: GitHub releases
- **File Associations**: MP3, FLAC, OGG, WAV files

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Use TypeScript for type safety
- Test your changes before submitting a PR
- Update documentation as needed

---

## 📸 Screenshots

![Main Screen](https://github.com/iamvany30/unisound-desktop/blob/main/image.jpg?raw=true)

---

## 🐛 Issues & Bug Reports

Found a bug or have a feature request? Please open an issue on the [GitHub Issues](https://github.com/iamvany30/unisound-desktop/issues) page.

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👤 Author

**Vanya**
- 📧 Email: [iamvany@vk.com](mailto:iamvany@vk.com)
- 🔗 GitHub: [@iamvany30](https://github.com/iamvany30)

---

## 🙋 Support

If you encounter any issues or have questions:
- 📝 Open an issue on GitHub
- 📧 Contact us at iamvany@vk.com
- 💬 Check existing issues for solutions

---

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Powered by [Electron](https://www.electronjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Animations with [Framer Motion](https://www.framer.com/motion/) 
