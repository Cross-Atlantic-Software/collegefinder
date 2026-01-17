# Exam Auto-Apply Bot 🤖

An AI-powered automated form-filling system for exam registrations. Uses **LLM Vision** (Gemini 2.5 Flash) to analyze pages and **Stagehand** for browser automation, integrated with the **CollegeFinder** platform.

## 🏗️ Architecture

```
┌─────────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  CollegeFinder      │────▶│  Python Backend  │────▶│ Stagehand Backend  │
│  Frontend + Backend │     │   (FastAPI)      │     │   (TypeScript)     │
│  Port: 3000, 5001   │     │   Port: 8001     │     │    Port: 3001      │
└─────────────────────┘     └──────────────────┘     └────────────────────┘
        │                           │                        │
        │                           ▼                        ▼
        │                  ┌──────────────────┐     ┌────────────────────┐
        │                  │  Gemini Vision   │     │   Browser (CDP)    │
        │                  │  (LLM Analysis)  │     │   via Stagehand    │
        │                  └──────────────────┘     └────────────────────┘
        │
        ▼
   WebSocket (Real-time logs, OTP requests, screenshots)
   
   PostgreSQL Database (Shared by CollegeFinder & Python Backend)
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Python 3.10+
- PostgreSQL 14+
- Docker (optional, for PostgreSQL)

### 1. CollegeFinder Setup (Frontend + Backend)

```bash
cd collegefinder

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Start frontend
npm run dev  # Port 3000

# Start backend (in new terminal)
cd backend
npm run dev  # Port 5001 (with Docker) or npm start (without Docker)
```

### 2. Python Backend Setup

```bash
cd python-backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Add your GOOGLE_API_KEY

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

### 3. Stagehand Backend Setup

```bash
cd stagehand-backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Add your GOOGLE_GENERATIVE_AI_API_KEY

# Start server
npm run dev  # Port 3001
```

### Environment Variables

**collegefinder/.env**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_AUTOMATION_WS_URL=ws://localhost:8001/ws
```

**collegefinder/backend/.env**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=collegefinder_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=5001
```

**python-backend/.env**
```env
GOOGLE_API_KEY=your_gemini_api_key
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/collegefinder_db
STAGEHAND_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000
```

**stagehand-backend/.env**
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
PORT=3001
```

## ✨ Features

### 🔐 UUID Password System
- Each user gets a unique UUID password (`automation_password`)
- Stored in PostgreSQL `users` table
- Used by LLM for password/confirm password fields in forms
- Viewable in user dashboard (TODO: UI component)

### 🤖 Intelligent Form Filling
- **LLM Vision Analysis**: Gemini 2.5 Flash analyzes screenshots
- **Smart Field Mapping**: Automatically maps user data to form fields
- **Captcha Solving**: AI reads and solves captchas automatically
- **OTP Handling**: Prompts user for OTP when needed

### 📊 Admin Dashboard
- Manage automation applications
- Monitor workflow progress in real-time
- View logs and screenshots
- Approve/reject applications

### 🔄 Real-time Updates
- WebSocket connection for live logs
- Screenshot preview during automation
- Progress tracking
- Status updates

## 🛠️ How It Works

### User Flow
1. **Student completes profile** → Personal details, academics, documents
2. **Admin creates application** → Selects user and exam
3. **Admin starts automation** → Bot fills form automatically
4. **User provides OTP** → When prompted via modal
5. **Success!** → Application submitted

### Automation Workflow
```
capture_screenshot → llm_decide → execute_action → (loop)
                                        ↓
                         ┌──────────────────────────────┐
                         │     Action Types:            │
                         │  • fill_field (form inputs)  │
                         │  • click_checkbox            │
                         │  • click_button              │
                         │  • wait_for_human (OTP)      │
                         │  • success (done!)           │
                         │  • retry (on errors)         │
                         └──────────────────────────────┘
```

### Database Schema
- **users**: Student profiles with `automation_password`
- **user_address**: Address details
- **user_academics**: Academic records
- **government_identification**: Aadhar, APAAR ID
- **other_personal_details**: Religion, income, etc.
- **automation_exams**: Supported exams (UPSC NDA, JEE, NEET, CUET)
- **automation_applications**: Application tracking
- **automation_sessions**: Workflow execution logs

## 📁 Project Structure

```
├── collegefinder/                # Main Next.js application
│   ├── app/                      # Next.js pages
│   │   ├── (admin)/              # Admin panel
│   │   │   └── admin/applications/  # Automation management
│   │   └── (auth)/               # Student onboarding
│   ├── components/               # React components
│   │   └── admin/WorkflowModal.tsx  # Real-time workflow UI
│   └── backend/                  # Node.js backend
│       ├── src/
│       │   ├── database/schema/  # PostgreSQL schemas
│       │   └── models/           # Database models
│       └── scripts/              # Seed scripts
│
├── python-backend/               # FastAPI + LangGraph
│   └── app/
│       ├── graph/                # Workflow orchestration
│       │   ├── nodes.py          # Action execution
│       │   ├── llm_decision.py   # LLM Vision analysis
│       │   └── builder.py        # Graph construction
│       ├── api/
│       │   ├── websocket.py      # Real-time communication
│       │   └── users.py          # User data API
│       └── services/
│           └── database.py       # PostgreSQL connection
│
└── stagehand-backend/            # TypeScript Stagehand
    └── src/
        ├── sessions.ts           # Browser session manager
        └── routes/api.ts         # Stagehand API endpoints
```

## 🔧 Technologies

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React, Tailwind CSS |
| Backend (Node) | Express, PostgreSQL, pg |
| Backend (Python) | FastAPI, LangGraph, Pydantic, asyncpg |
| Stagehand | TypeScript, Stagehand v3, Playwright |
| LLM | Gemini 2.5 Flash (Vision + JSON mode) |
| Database | PostgreSQL 14+ |
| Realtime | WebSockets |

## 📝 Supported Exams

- **UPSC NDA** - National Defence Academy
- **JEE Main** - Engineering entrance
- **NEET UG** - Medical entrance
- **CUET UG** - Central university entrance

## 🔄 Git Workflow - Pushing to stagehand-final Branch

### Initial Setup (First Time)
```bash
# Navigate to project root
cd c:\Users\Rahul\OneDrive\Desktop\LLM\stage_hand_bot\Exam-autoapply-bot

# Check current branch
git branch

# Create and switch to stagehand-final branch
git checkout -b stagehand-final

# Add all changes
git add .

# Commit changes
git commit -m "feat: Complete stagehand automation system with UUID passwords"

# Push to remote (creates branch on GitHub)
git push -u origin stagehand-final
```

### Subsequent Updates
```bash
# Make sure you're on stagehand-final branch
git checkout stagehand-final

# Add all changes
git add .

# Commit with descriptive message
git commit -m "fix: Update schema and LLM prompts"

# Push to remote
git push
```

### Common Git Commands
```bash
# Check status
git status

# View current branch
git branch

# Switch branches
git checkout main
git checkout stagehand-final

# Pull latest changes
git pull origin stagehand-final

# View commit history
git log --oneline

# Discard local changes (careful!)
git reset --hard HEAD
```

## 🗄️ Database Setup

### Using Docker (Recommended)
```bash
cd collegefinder/backend
npm run dev  # Starts PostgreSQL in Docker + backend
```

### Manual PostgreSQL Setup
```bash
# Create database
createdb collegefinder_db

# Run schema initialization
cd collegefinder/backend
npm start  # Initializes all tables

# Seed data
node scripts/seedStreams.js
node scripts/seedCareerGoals.js
node scripts/seedAutomationExams.js
```

## ⚠️ Important Notes

- **For educational purposes only**
- Ensure compliance with website terms of service
- OTP requires user intervention (can't be automated)
- Password field uses UUID, not user's login password
- WebSocket requires port 8001 to be accessible
- CORS is configured for development (localhost)

## 🐛 Troubleshooting

### WebSocket Connection Failed
- Ensure python-backend is running on port 8001
- Check `NEXT_PUBLIC_AUTOMATION_WS_URL` in `.env`
- Restart frontend after changing env vars

### Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `collegefinder_db` exists

### LLM API Errors
- Verify `GOOGLE_API_KEY` is set correctly
- Check API quota/billing on Google Cloud
- Model name is `gemini-2.5-flash`

---

Made with ❤️ using Stagehand + Gemini Vision + LangGraph
