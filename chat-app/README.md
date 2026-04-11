# 💬 ChatNet – Local Network Chat Application

A **real-time chat application** for local networks built with Node.js, Express, and Socket.IO.  
No internet required — works on any shared WiFi or LAN.

---

## 🚀 Features

- ✅ Real-time messaging (Socket.IO)
- ✅ Multiple chat rooms
- ✅ Private/DM messaging
- ✅ Online user list with avatars
- ✅ Typing indicators
- ✅ Image sharing
- ✅ Message history (last 100 messages per room)
- ✅ Create custom rooms
- ✅ Works on any device on the same network (mobile, PC, tablet)

---

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/chat-app-vcs.git
cd chat-app-vcs

# Install dependencies
npm install

# Start the server
npm start
```

The server starts on `http://0.0.0.0:3000`.  
A list of network IPs will be printed — share those with teammates.

---

## 🌐 Usage

1. Start the server on one machine.
2. All teammates open `http://<server-ip>:3000` in their browser.
3. Enter a display name and choose a room → click **Join Chat**.

---

## 📁 Project Structure

```
chat-app/
├── server.js           ← Express + Socket.IO server
├── package.json
├── public/
│   └── index.html      ← Full frontend (HTML/CSS/JS)
└── README.md
```

---

## 🔧 Git Collaboration Workflow (Mandatory for VCS Project)

This project follows a **collaborative Git branching model**.

### Branch Strategy

```
main          ← stable, production-ready
develop       ← integration branch
feature/*     ← individual feature branches
bugfix/*      ← bug fix branches
```

### Step-by-Step Workflow

```bash
# 1. Fork the repo and clone your fork
git clone https://github.com/<your-username>/chat-app-vcs.git
cd chat-app-vcs

# 2. Add upstream remote
git remote add upstream https://github.com/<lead-username>/chat-app-vcs.git

# 3. Create your feature branch from develop
git checkout develop
git pull upstream develop
git checkout -b feature/your-feature-name

# 4. Make changes and commit often
git add .
git commit -m "feat: add typing indicator"

# 5. Push your branch
git push origin feature/your-feature-name

# 6. Open a Pull Request on GitHub: your fork → upstream/develop
# 7. Group Leader reviews and merges PRs
# 8. After milestone, Group Leader merges develop → main
```

### Commit Message Convention

```
feat:     new feature
fix:      bug fix
docs:     documentation
style:    formatting only
refactor: code restructure
test:     adding tests
chore:    maintenance tasks
```

### Example

```bash
git commit -m "feat: add private messaging feature"
git commit -m "fix: resolve typing indicator not clearing"
git commit -m "docs: update README with installation steps"
```

---

## 👥 Team Roles (Update in Google Sheet)

| Member | Role |
|--------|------|
| LEAD   | Project setup, Git management, server.js |
| Member 2 | Frontend UI, CSS styling |
| Member 3 | Socket events, rooms logic |
| Member 4 | Private messaging, user list |
| Member 5 | Testing, documentation, README |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Real-time | Socket.IO |
| Frontend | HTML5, CSS3, Vanilla JS |
| Version Control | Git / GitHub |

---

## 📋 System Requirements

- **Node.js** v16+
- **npm** v7+
- All devices on the **same WiFi/LAN network**
- Modern browser (Chrome, Firefox, Edge)
