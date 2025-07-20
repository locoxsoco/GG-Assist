# 🛡️ GG-Assist — Privacy-First Gmail Assistant

**GG-Assist** is a local AI-powered desktop assistant that helps you process your Gmail inbox securely and intelligently — without sending any data to the cloud.

Designed for the [#AIonRTXHackathon](https://developer.nvidia.com), GG-Assist uses a local LLM and the G-Assist plugin framework to extract useful information from your emails while keeping your data 100% private.

---

## ✨ Features

### 📅 Detect Calendar Events
Scan your inbox for meetings, appointments, and deadlines. GG-Assist finds emails with date/time information and helps you add them to your Google Calendar with one click.

### 🏷 Generate Smart Labels
Automatically categorize your emails with relevant labels like `billing`, `travel`, or `meetings`, using local AI understanding.

### 📝 Summarize Emails
Generate concise 280-character summaries for each email so you can preview content without opening the full message.

---

## 🚀 Getting Started

### 1. Clone the Repo
```bash
git clone https://github.com/your-username/GG-Assist.git
cd GG-Assist
```

### 2. Install the G-Assist Plugin
Ensure you're using the G-Assist framework. This repo contains a plugin with:

* plugin.py — the Gmail handler logic
* manifest.json — function interface for G-Assist
* requirements.txt — dependencies

### 3. Enable the Gmail API and Obtain Credentials

To allow GG-Assist to access your Gmail account securely, you'll need to enable the Gmail API and download your OAuth2 credentials.

Follow these steps:

1. Go to the [Gmail API Quickstart for Python](https://developers.google.com/workspace/gmail/api/quickstart/python)
2. Click **"Enable the Gmail API"**
3. Sign in with your Google account
4. Create a new project or select an existing one
5. Download the **`credentials.json`** file
6. Place the `credentials.json` file in your directory (next to `gmail-backend.py`)

### 5. Run the Flask backend
```
python gmail-backend.py
```

### 5. Install & Run the Electron App
The UI is built with React + Electron for a desktop experience.

```
cd electron-react-app
npm install
npm start
```

## 🛠 Tech Stack

* 🧠 Local LLM via G-Assist framework
* ⚡️ Flask for backend server
* 🔐 Gmail API (OAuth2)
* 🖥 Electron + React frontend

---
