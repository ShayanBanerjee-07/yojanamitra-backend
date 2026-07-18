# 🇮🇳 YojanaMitra AI - NxtWave Hackathon Submission

**Live Demo:** [https://yojanamitra-frontend.vercel.app]
**Backend API:** [https://yojanamitra-backend-xvwl.onrender.com]

## 🎯 The Problem
Millions of eligible citizens in rural India miss out on government schemes because of complex eligibility criteria and difficult-to-navigate government portals. The barrier is language and digital literacy, not the lack of schemes.

## 💡 The Solution
**YojanaMitra AI** is a Voice/Text AI assistant built for rural India. Users simply describe their situation in natural language (e.g., *"I am a 45-year-old farmer from Chhattisgarh with a 2 Lakh income"*). 
The AI engine processes this unstructured data, extracts key demographic variables, and maps them to a structured database to fetch the exact schemes they are eligible for instantly.

## ⚙️ Technical Architecture
* **Frontend:** React.js, modern UI with responsive design (Deployed on Vercel).
* **Backend:** Python FastAPI for high-performance API routing (Deployed on Render).
* **AI/LLM Engine:** Groq API (LLaMA 3.1 8B Instant) for ultra-fast NLP data extraction.
* **Database:** Supabase (PostgreSQL) for storing and querying government scheme criteria.
* **Audio Processing:** Browser MediaRecorder API integrated with backend transcription.

## 🚀 Key Features
1. **Natural Language Processing:** Converts conversational Hindi/English into structured JSON (Age, Income, Occupation, State).
2. **Smart Match Algorithm:** Accurately filters database rows based on dynamic AI-extracted parameters.
3. **Voice Integration:** Allows users to speak their problems instead of typing.
4. **Cloud Native:** Fully deployed and decoupled frontend-backend architecture.

---
*Built as a solo project for the NxtWave CCBP 4.0 Hackathon Qualifier.*
