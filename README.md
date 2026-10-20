# PrismChat 3D — Live Rooms & Random Social Lounge

[![Live Application](https://img.shields.io/badge/Live_App-Online_Now-f97316?style=for-the-badge)](https://ais-pre-ogcvuph5k4tsmdvbfnkcf7-586190855991.asia-southeast1.run.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-sunrisezes%2Fchatap-2563eb?style=for-the-badge&logo=github)](https://github.com/sunrisezes/chatap)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_%26_Auth-ffca28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

A modern, responsive 3D spatial real-time chat platform where people around the world can connect in public lounges, pair up for instant 1-on-1 random conversations, or host private password-protected (PVR) rooms with voice notes, photos, videos, and emoji reactions.

---

## 🌐 Live Demo

- **Live Production URL:** [https://ais-pre-ogcvuph5k4tsmdvbfnkcf7-586190855991.asia-southeast1.run.app](https://ais-pre-ogcvuph5k4tsmdvbfnkcf7-586190855991.asia-southeast1.run.app)
- **GitHub Repository:** [https://github.com/sunrisezes/chatap](https://github.com/sunrisezes/chatap)

---

## ✨ Key Features

- **Instant Guest & Verified Account Onboarding**
  - Join immediately as a **Guest** (choose username, date of birth with 18+ verification, gender, and a 3D preset or custom uploaded avatar—no email required).
  - Or sign in with an **Email Account** or **Google Sign-In** for persistent cross-device profiles.
- **Public Lounges, Locked Rooms & Password-Protected PVR Rooms**
  - Browse active public rooms, create custom rooms with 3D spatial lighting themes, invite online users with 1-click room passes, lock/unlock room posting, or protect private rooms with a PVR passcode.
- **1-Click Random 1-on-1 Matching**
  - Pair up immediately with an eligible online user for a private 1-on-1 conversation.
- **Rich Media & Interactive Voice Notes**
  - Record and send voice notes with an interactive audio waveform player, upload photos and video clips, insert emojis, and react to messages in real time.
- **User Directory, Personal Blocking & Reporting**
  - Filter active users by gender or search query, inspect user profiles, block unwanted users (instantly hiding their messages), or submit safety reports.
- **Google AdSense Integration**
  - Built-in responsive sidebar and banner ad slots supporting live Google AdSense publisher IDs (`ca-pub-...`) and ad unit slots.

---

## 🛠️ Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, HTML5 Canvas 3D Spatial Backdrop
- **Backend & Real-Time Database:** Firebase Authentication & Cloud Firestore (`firestore.rules` with zero-trust attribute-based access control)
- **Build & Tooling:** Vite, Node.js Test Runner (`node:test`)

---

## 🚀 Getting Started Locally

### 1. Clone the repository

```bash
git clone https://github.com/sunrisezes/chatap.git
cd chatap
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Run unit & security tests

```bash
node --test src/utils/chatLogic.test.ts firestore.rules.test.ts
```

### 5. Build for production

```bash
npm run build
```

---

## 📦 Pushing to GitHub (`sunrisezes/chatap`)

If you are pushing from the AI Studio toolbar, click the **GitHub** icon at the top right to sync directly, or run the following commands locally:

```bash
git remote set-url origin https://github.com/sunrisezes/chatap.git
git branch -M main
git push -u origin main
```
