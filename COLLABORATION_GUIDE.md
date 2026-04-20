# IKMS Collaboration & Setup Guide

Welcome to the IKMS project! This guide will help you set up the environment on your local machine to test and contribute to the platform.

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **Elasticsearch 9.3.3** (Download and unzip)
- **Supabase Account** (We are using a shared shared project, you should have the `.env` values)

### 2. Backend Setup
1. Navigate to the `backend` folder.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the `backend` folder (ask for the credentials).
4. Run the application:
   ```bash
   python app.py
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` folder.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

### 4. Elasticsearch Configuration (Crucial)
To enable the search features without complex SSL/Security setup:
1. Go to your Elasticsearch `config/elasticsearch.yml`.
2. Set these values:
   ```yaml
   xpack.security.enabled: false
   xpack.security.enrollment.enabled: false
   xpack.security.http.ssl:
     enabled: false
   xpack.security.transport.ssl:
     enabled: false
   ```
3. Start Elasticsearch: `.\bin\elasticsearch.bat`.
4. Index existing documents to make them searchable:
   ```bash
   cd backend
   python sync_es.py
   ```

## 📂 Project Structure
- `backend/`: Flask API, ML Engine (NLTK, spaCy), and Database Models.
- `frontend/`: React + Vite + Tailwind/Glassmorphism UI.
- `document/`: FYP Thesis Chapters and Documentation.

## 🛠️ Key Features to Test
- **Researcher Dashboard**: Uploading PDFs and tracking impact.
- **Master Search**: Full-text search with relevancy ranking (Elasticsearch).
- **Institution Management**: Bulk archive uploads and analytics.
- **Verification Flow**: Requesting publishing access and admin approval.

---
*Note: Make sure your `.env` file is never committed to GitHub.*
