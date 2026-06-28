# CommandHub

> Search. Learn. Execute.

CommandHub is an AI-powered command launcher and knowledge base for Windows. It helps users search, understand, and safely execute Windows, PowerShell, CMD, Git, Docker, and developer commands from a beautiful desktop application.

## 🚀 Features
- **Global Search**: Search commands instantly (Ctrl+K).
- **Command Library**: Categorized library of useful commands with risk levels.
- **AI Explanations**: Understand any command before you run it using OpenRouter/Ollama.
- **Built-in Terminal**: Live output and execution history.
- **Plugin System**: Extend functionality with custom Python plugins.
- **Offline First**: Local SQLite cache keeps you moving fast.

## 🛠️ Tech Stack
- Frontend: React, TypeScript, Tailwind CSS, Tauri
- Backend: Python FastAPI Sidecar
- Database: SQLite (Local)

## 📦 Installation
```powershell
irm https://raw.githubusercontent.com/adityasing9/CommandHub/main/scripts/install.ps1 | iex
```

## 💻 Development
1. Clone the repository.
2. Run `npm install`.
3. Create Python virtual env in `backend/`.
4. Run `npm run tauri dev`.

## 📜 License
MIT License. See `LICENSE` for details.
