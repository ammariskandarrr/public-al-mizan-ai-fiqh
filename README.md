# Al-Mizan AI Fiqh Platform

<div align="center">

**An intelligent Islamic Finance assistant powered by AI, providing Shariah-compliant financial guidance and document analysis.**

[![React](https://img.shields.io/badge/React-19.2.3-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Knowledge Sources](#knowledge-sources)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**Al-Mizan AI Fiqh** is a comprehensive Islamic Finance platform that leverages advanced AI technologies to provide:

- **Real-time Shariah guidance** through an intelligent chatbot
- **Document compliance analysis** using multi-agent AI systems
- **Voice-based consultation** for accessibility
- **Citation-backed responses** from authoritative Islamic finance sources

The platform is designed for Islamic finance professionals, scholars, and anyone seeking reliable Shariah-compliant financial guidance.

---

## ✨ Features

### 🤖 Agentic Chatbot
- **Multi-source RAG (Retrieval-Augmented Generation)** powered by OpenAI embeddings
- Real-time search across multiple Islamic finance knowledge bases
- Citation-backed answers with source references
- Markdown-formatted responses with tables and structured content
- Interactive citation popups showing source details

### 📄 Document Analyzer
- **Multi-agent AI system** for comprehensive Shariah compliance auditing
- Parallel analysis by specialized agents:
  - **Agent A**: BNM Shariah Resolutions compliance
  - **Agent B**: Islamic Financial Services Act (IFSA) 2013 compliance
  - **Agent C**: Shariah Contract Framework validation
  - **Agent D**: Mufti Q&A and scholarly opinions
- **Synthesis Agent** (Gemini 2.5 Pro) consolidates findings
- Generates structured audit reports with:
  - Compliance status and scoring
  - Problematic clause identification
  - Authority references
  - Actionable recommendations
- Supports PDF, DOCX, and image uploads

### 🎙️ Live Consultant
- Voice-based consultation using speech recognition
- Real-time transcription and AI-powered responses
- Text-to-speech output for accessibility
- Hands-free interaction mode

### 🔐 Authentication & User Management
- Secure authentication via Supabase
- User session management
- Protected routes and personalized experience

---

## 🏗️ Architecture

### Chatbot Architecture
```
User Query → Embedding Generation (OpenAI) → Parallel Vector Search
    ↓
┌─────────────────────────────────────────────────────────┐
│  Vector Databases (Supabase pgvector)                   │
│  • BNM Shariah Resolutions                              │
│  • Islamic Financial Services Act 2013                  │
│  • Shariah Contract Framework                           │
│  • Mufti Q&A Collections                                │
└─────────────────────────────────────────────────────────┘
    ↓
Context Curation → LLM Generation (GPT-4o-mini) → Response with Citations
```

### Document Analyzer Architecture
```
Document Upload → Text Extraction (Gemini 2.5 Flash)
    ↓
Embedding Generation → Parallel Agent Execution
    ↓
┌──────────┬──────────┬──────────┬──────────┐
│ Agent A  │ Agent B  │ Agent C  │ Agent D  │
│ BNM      │ IFSA     │ Contract │ Mufti    │
│ (GPT-4o) │ (GPT-4o) │ (GPT-4o) │ (GPT-4o) │
└──────────┴──────────┴──────────┴──────────┘
    ↓
Synthesis Agent (Gemini 2.5 Pro)
    ↓
Structured Audit Report
```

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2.3** - UI framework
- **TypeScript 5.8.2** - Type safety
- **Vite 6.2.0** - Build tool and dev server
- **React Router 7.12.0** - Client-side routing
- **TailwindCSS** - Utility-first styling
- **Lucide React** - Icon library
- **React Markdown** - Markdown rendering with GFM support

### AI & ML
- **OpenAI GPT-4o-mini** - Primary LLM for chatbot and agents
- **Google Gemini 2.5 Flash** - Document text extraction
- **Google Gemini 2.5 Pro** - Synthesis agent
- **OpenAI text-embedding-3-large** - Vector embeddings (1536 dimensions)

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database with pgvector extension
  - Authentication and user management
  - Vector similarity search
  - Real-time subscriptions

### Additional Libraries
- **jsPDF** - PDF generation
- **docx** - DOCX file handling
- **file-saver** - File download utilities
- **pdf-parse** - PDF text extraction

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and npm
- **Supabase account** with a project set up
- **OpenAI API key**
- **Google AI API key** (for Gemini models)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/al-mizan-ai-fiqh.git
   cd al-mizan-ai-fiqh
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_GOOGLE_API_KEY=your_google_ai_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

---

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | ✅ |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ |
| `VITE_OPENAI_API_KEY` | OpenAI API key for GPT models | ✅ |
| `VITE_GOOGLE_API_KEY` | Google AI API key for Gemini models | ✅ |

---

## 📖 Usage

### Chatbot
1. Navigate to the **Chatbot** tab
2. Type your Islamic finance question
3. View AI-generated response with citations
4. Click citation numbers to view source details

### Document Analyzer
1. Navigate to the **Document Analyzer** tab
2. Upload a PDF, DOCX, or image document
3. Wait for multi-agent analysis (typically 30-60 seconds)
4. Review the structured audit report with:
   - Compliance status
   - Problematic clauses
   - Recommendations
5. Download the report as PDF

### Live Consultant
1. Navigate to the **Live Consultant** tab
2. Click the microphone button to start
3. Speak your question
4. Receive voice and text responses

---

## 📁 Project Structure

```
al-mizan-ai-fiqh/
├── components/
│   ├── AgenticChatBot.tsx      # Main chatbot component
│   ├── DocumentAnalyzer.tsx    # Document analysis interface
│   ├── LiveConsultant.tsx      # Voice consultation
│   ├── Dashboard.tsx           # Main dashboard layout
│   ├── LandingPage.tsx         # Public landing page
│   ├── AuthModal.tsx           # Authentication modal
│   └── ui/
│       ├── CitationPopup.tsx   # Citation display modal
│       ├── ActionSteps.tsx     # Agent step visualization
│       └── Modal.tsx           # Reusable modal component
├── services/
│   ├── agentService.ts         # Multi-agent orchestration
│   ├── supabaseClient.ts       # Supabase configuration
│   ├── openaiService.ts        # OpenAI API integration
│   └── geminiService.ts        # Google Gemini integration
├── context/
│   └── AuthContext.tsx         # Authentication context
├── backend/
│   └── [Python scrapers and data processing]
├── types.ts                    # TypeScript type definitions
├── constants.ts                # App constants
└── App.tsx                     # Root component
```

---

## 📚 Knowledge Sources

The platform draws from authoritative Islamic finance sources:

### VDB-01: BNM Shariah Resolutions
Bank Negara Malaysia Shariah Advisory Council resolutions - the highest regulatory authority for Islamic finance in Malaysia.

### VDB-02: Islamic Financial Services Act 2013
Primary legislation governing Islamic financial institutions in Malaysia.

### VDB-03: Shariah Contract Framework
BNM's standardized parameters for Islamic contracts (Murabahah, Ijarah, etc.).

### VDB-04 & VDB-05: Mufti Q&A
Scholarly opinions and fatwas on Islamic finance matters from recognized Islamic scholars.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Bank Negara Malaysia** for Shariah resolutions and frameworks
- **OpenAI** for GPT models
- **Google** for Gemini models
- **Supabase** for backend infrastructure
- Islamic finance scholars and institutions for knowledge contributions

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

<div align="center">

**Built with ❤️ for the Islamic Finance community**

</div>
