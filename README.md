# ⚙️ DoChat Server — Backend API & Real-Time System

---

## 📌 Project Overview

- Backend system for DoChat real-time social chat platform  
- Handles authentication, user management, friend requests, notifications, and messaging  
- Provides secure REST API services  
- Manages Socket.IO real-time communication  
- Solves duplicate request and socket reconnection issues  
- Designed for scalable and secure social communication  

👉 **Main goal:** Build a secure, reliable, and scalable backend for real-time social interaction  

---

## 🌐 Live API

- 🔗 Backend (Render): https://do-chat-server.onrender.com

---

## 🚀 Core Features

- 🔐 JWT Authentication System  
- 👤 User Registration & Login API  
- 🔎 User Search API  
- ➕ Send Friend Request  
- ❌ Cancel Friend Request  
- 🚫 Unfriend System  
- 🔔 Notification Management  
- 💬 Real-Time Messaging with Socket.IO  
- 🟢 Active User Tracking  
- ⌨️ Typing Status Events  
- 📜 Message Pagination  
- 🔄 Socket Reconnection Recovery  
- 🛡️ Protected Routes & Middleware  

---

## 🧠 Problems Solved

### 🔁 Duplicate Friend Request Prevention
Users sometimes sent multiple friend requests due to repeated clicks.  

**Solution:**  
- MongoDB unique validation  
- Request duplication prevention logic  
- Notification duplication control  

### 🔌 Socket Reconnection Issue
Disconnected users were not always restored correctly after reconnecting.  

**Solution:**  
- User socket ID re-registration  
- Active user restoration  
- Reconnect-aware event handling  

### 🔐 Security Challenges
Needed secure communication between frontend and backend.  

**Solution:**  
- JWT protected routes  
- CORS security configuration  
- Frontend proxy support  

---

## 🛠️ Tech Stack

### ⚙️ Backend Core
- Node.js  
- Express.js  

### 🗄️ Database
- MongoDB  

### 🔐 Authentication & Security
- JWT  
- CORS  

### 🔄 Real-Time Communication
- Socket.IO  

---

## 📦 Installation & Setup

```bash
git clone https://github.com/your-username/DoChat-Server.git
cd DoChat-Server
npm install
npm start
