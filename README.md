<p align="center">
  <img src="https://img.shields.io/badge/EcoLens-AI--Powered%20ESG%20Analyzer-059669?style=for-the-badge&logo=leaf&logoColor=white" alt="EcoLens Badge" />
</p>

<h1 align="center">🌿 EcoLens — AI-Powered ESG & Carbon Footprint Analyzer</h1>

<p align="center">
  <strong>An intelligent platform that extracts, analyzes, and visualizes Environmental, Social & Governance (ESG) metrics from sustainability reports using Machine Learning.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.1-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js" />
  <img src="https://img.shields.io/badge/Flask-3.0-000000?style=flat-square&logo=flask" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-4169E1?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/PyTorch-ML%20Models-EE4C2C?style=flat-square&logo=pytorch" />
  <img src="https://img.shields.io/badge/Cloudinary-File%20Storage-3448C5?style=flat-square&logo=cloudinary" />
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [ESG Metrics Extracted](#-esg-metrics-extracted)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [ML Pipeline](#-ml-pipeline)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

**EcoLens** is a full-stack web application that enables companies to upload their sustainability/ESG reports (BRSR, GRI, or custom PDFs) and automatically extract 11 key ESG metrics using a custom-trained ML pipeline. The platform then calculates ESG scores, generates AI-powered recommendations, and provides an analytics dashboard for tracking sustainability performance over time.

### Key Capabilities

- 🤖 **AI-Powered Extraction** — Custom NER + Classifier models extract metrics from messy PDF tables
- 📊 **11 ESG Metrics** — Scope 1/2/3 emissions, energy, water, waste, diversity, safety, and more
- 📈 **ESG Scoring** — Automated scoring with Environmental, Social & Governance breakdowns
- 💡 **AI Recommendations** — Google Gemini-powered sustainability improvement suggestions
- 📥 **Full Report Lifecycle** — Upload → Extract → Analyze → View → Export → Download
- 👥 **Dual Portal** — Separate company and investor interfaces

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React + Vite)                     │
│  ┌──────────┐ ┌───────────┐ ┌─────────┐ ┌──────────┐ ┌────────┐│
│  │Dashboard │ │  Upload   │ │ History │ │  Report  │ │Settings││
│  │  Page    │ │   Page    │ │  Page   │ │  Detail  │ │  Page  ││
│  └────┬─────┘ └─────┬─────┘ └────┬────┘ └────┬─────┘ └───┬────┘│
│       └──────────────┴───────────┴────────────┴───────────┘     │
│                              │ REST API                          │
└──────────────────────────────┼───────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────┐
│                    SERVER (Node.js + Express)                    │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐ │
│  │    Auth    │ │  Company   │ │ Dashboard  │ │   Profile    │ │
│  │ Controller │ │ Controller │ │ Controller │ │  Controller  │ │
│  └─────┬──────┘ └──────┬─────┘ └──────┬─────┘ └──────┬───────┘ │
│        │               │              │               │         │
│  ┌─────┴───────────────┴──────────────┴───────────────┘         │
│  │  Services: ESG Scoring │ Metrics Storage │ AI Recommendations│
│  └─────────────┬──────────────────────────────┬─────────────────┘
│                │                              │                  │
│         ┌──────┴──────┐              ┌────────┴────────┐        │
│         │ PostgreSQL  │              │    Cloudinary    │        │
│         │  Database   │              │   File Storage   │        │
│         └─────────────┘              └─────────────────┘        │
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTP (multipart/form-data)
┌──────────────────────────────┼───────────────────────────────────┐
│              ML SERVICE (Flask + PyTorch)                         │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────────────┐  │
│  │ PDF Parser   │→ │ Table Recon-  │→ │ NER + Classifier     │  │
│  │ (pdfplumber) │  │ structor      │  │ (RoBERTa-based)      │  │
│  └──────────────┘  └───────────────┘  └──────────┬───────────┘  │
│                                                   │              │
│                                      ┌────────────┴────────┐    │
│                                      │  11 ESG Metrics     │    │
│                                      │  (Raw Values)       │    │
│                                      └─────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Company Portal
| Feature | Description |
|---------|-------------|
| **Upload Reports** | Drag-and-drop PDF/CSV upload with real-time processing feedback |
| **Dashboard** | ESG scores, emissions breakdown (pie chart), trend lines, KPIs |
| **Time Range Filtering** | Filter dashboard data by 1 month, 3 months, 1 year, or YTD |
| **Report History** | Paginated list with search, view analysis, and download |
| **Report Detail View** | All 11 raw metrics grouped by category + ESG scores |
| **PDF Export** | Generate professional ESG report PDFs |
| **AI Recommendations** | Gemini-powered sustainability improvement suggestions |
| **Company Settings** | Manage company profile with country/industry dropdowns |
| **Duplicate Prevention** | Blocks re-uploading of same-named files |
| **Retry Mechanism** | One-click retry for failed uploads |

### Investor Portal
| Feature | Description |
|---------|-------------|
| **Investor Dashboard** | Portfolio overview and ESG analytics |
| **Portfolio Builder** | Build and manage investment portfolios |
| **Company Comparison** | Side-by-side ESG comparison of companies |
| **News Feed** | ESG-related news aggregation |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **React Router 7** | Client-side routing |
| **Recharts 3** | Charts & data visualization |
| **Tailwind CSS 3** | Utility-first styling |
| **Lucide React** | Icon library |
| **Framer Motion** | Animations |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Node.js + Express 5** | REST API server |
| **PostgreSQL** | Relational database |
| **JWT** | Authentication & authorization |
| **Multer** | File upload handling |
| **Cloudinary** | Cloud file storage |
| **PDFKit** | PDF report generation |
| **Google Gemini AI** | AI recommendation generation |

### ML Service
| Technology | Purpose |
|-----------|---------|
| **Flask 3** | API server for ML pipeline |
| **PyTorch** | Deep learning framework |
| **Transformers (HuggingFace)** | RoBERTa-based NER & Classifier |
| **pdfplumber + Camelot** | PDF parsing & table extraction |
| **Sentence Transformers** | Semantic similarity for metric matching |

---

## 📊 ESG Metrics Extracted

EcoLens extracts **11 core ESG metrics** from uploaded reports:

### Environmental (6 metrics)
| Metric | Unit | Description |
|--------|------|-------------|
| `SCOPE_1` | tCO₂e | Direct GHG emissions |
| `SCOPE_2` | tCO₂e | Indirect energy-related emissions |
| `SCOPE_3` | tCO₂e | Other indirect emissions |
| `ENERGY_CONSUMPTION` | MJ | Total energy consumed |
| `WATER_USAGE` | KL | Total water consumed |
| `WASTE_GENERATED` | MT | Total waste produced |

### Social (3 metrics)
| Metric | Unit | Description |
|--------|------|-------------|
| `GENDER_DIVERSITY` | % | Female representation percentage |
| `SAFETY_INCIDENTS` | count | Workplace safety incidents |
| `EMPLOYEE_WELLBEING` | % | Employee satisfaction/wellbeing score |

### Governance (2 metrics)
| Metric | Unit | Description |
|--------|------|-------------|
| `DATA_BREACHES` | count | Number of data security breaches |
| `COMPLAINTS` | count | Compliance complaints received |

> **Critical Rule**: Raw metric values from Flask are **never modified or normalized** during storage or display. Normalization only occurs during ESG score calculation in `esg.service.js`.

---

## 📁 Project Structure

```
EcoLens-An-AI-Powered-ESG-and-Carbon-Footprint-Analyzer/
│
├── Client/Ecolens/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── company/
│   │   │   │   └── CompanyLayout.jsx       # Company portal layout with sidebar
│   │   │   ├── investor/
│   │   │   └── ProtectedRoute.jsx          # Route guard (role-based)
│   │   ├── context/
│   │   │   └── AuthContext.jsx             # Global auth state
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Signup.jsx
│   │   │   ├── company/
│   │   │   │   ├── DashboardPage.jsx       # ESG analytics dashboard
│   │   │   │   ├── UploadPage.jsx          # Report upload with AI extraction
│   │   │   │   ├── HistoryPage.jsx         # Report history with search + pagination
│   │   │   │   ├── ReportDetailPage.jsx    # Single report with all 11 metrics
│   │   │   │   ├── SettingsPage.jsx        # Company settings (in-portal)
│   │   │   │   └── ProfileSetup.jsx        # First-time profile setup
│   │   │   ├── investor/
│   │   │   └── Homepage.jsx
│   │   ├── services/
│   │   │   ├── auth.js                     # Auth API calls + token mgmt
│   │   │   ├── company.js                  # Company API calls (dashboard, reports, export)
│   │   │   ├── profile.js                  # Profile API calls
│   │   │   └── investor.js                 # Investor API calls
│   │   └── App.jsx                         # Route definitions
│   └── package.json
│
├── Server/Node/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                       # PostgreSQL connection pool
│   │   │   └── cloudinary.js               # Cloudinary config
│   │   ├── controllers/
│   │   │   ├── auth.controller.js          # Login, Signup
│   │   │   ├── company.controller.js       # Upload, Reports CRUD, Export, Download
│   │   │   ├── company.dashboard.controller.js  # Dashboard with time-range filtering
│   │   │   └── company.profie.controller.js     # Profile GET + PUT
│   │   ├── middleware/
│   │   │   └── auth.middleware.js           # JWT auth + role authorization
│   │   ├── routes/
│   │   │   ├── company.routes.js            # All company endpoints
│   │   │   └── auth.routes.js
│   │   ├── services/
│   │   │   ├── esg.service.js              # ESG score calculation (normalization here ONLY)
│   │   │   └── metrics.service.js          # DB operations for metrics + scores
│   │   ├── utils/
│   │   │   ├── metricExtractor.js          # Flask response → metrics (null-safe)
│   │   │   └── aiRecommendation.js         # Gemini AI recommendations
│   │   ├── scripts/
│   │   │   └── migrate-esg-data.js         # DB migration utility
│   │   └── index.js                        # Express server entry point
│   └── package.json
│
├── Server/Flask/                   # ML Extraction Service
│   ├── app.py                              # Flask API (POST /extract)
│   ├── evaluate_on_pdf.py                  # Full extraction pipeline
│   ├── models/                             # Trained NER + Classifier models
│   ├── generate_esg_dataset.py             # Training data generation
│   ├── phase1_data_transformation.py       # Data preprocessing
│   ├── phase2_model_training.py            # Model training
│   ├── phase3_6_evaluation_robustness.py   # Evaluation & testing
│   └── requirements.txt
│
└── Dataset/                        # Training datasets
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **Python** ≥ 3.9
- **PostgreSQL** ≥ 14
- **npm** or **yarn**

### 1. Clone the Repository

```bash
git clone https://github.com/13NILAY/EcoLens-An-AI-Powered-ESG-and-Carbon-Footprint-Analyzer.git
cd EcoLens-An-AI-Powered-ESG-and-Carbon-Footprint-Analyzer
```

### 2. Set Up the Database

Create a PostgreSQL database and run the following schema:

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('company', 'investor')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Companies table
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255),
  industry VARCHAR(100),
  country VARCHAR(100),
  market_cap VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reports table
CREATE TABLE reports (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id),
  file_name VARCHAR(500),
  file_type VARCHAR(100),
  file_url TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ESG Metrics (raw values — never modified)
CREATE TABLE esg_metrics (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id),
  metric_name VARCHAR(50) NOT NULL,
  metric_value NUMERIC,
  metric_unit VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ESG Scores (calculated from raw metrics)
CREATE TABLE esg_scores (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id),
  environmental NUMERIC,
  social NUMERIC,
  governance NUMERIC,
  overall_score NUMERIC,
  grade VARCHAR(2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI Recommendations
CREATE TABLE ai_recommendations (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id),
  title VARCHAR(500),
  description TEXT,
  impact VARCHAR(20),
  effort VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Investor Profiles
CREATE TABLE investor_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  country VARCHAR(100),
  market_cap VARCHAR(50),
  industry VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Set Up the Flask ML Service

```bash
cd Server/Flask

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the service (loads ML models)
python app.py
# → Running on http://localhost:5000
```

### 4. Set Up the Node.js Backend

```bash
cd Server/Node

# Install dependencies
npm install

# Create .env file (see Environment Variables section)

# Start the server
npm run dev
# → Running on http://localhost:8080
```

### 5. Set Up the React Frontend

```bash
cd Client/Ecolens

# Install dependencies
npm install

# Create .env file (see Environment Variables section)

# Start the dev server
npm run dev
# → Running on http://localhost:5173
```

---

## 🔐 Environment Variables

### Server/Node/.env

```env
PORT=8080
DATABASE_URL=postgresql://username:password@localhost:5432/ecolens
JWT_SECRET=your_jwt_secret_key

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_gemini_api_key
```

### Client/Ecolens/.env

```env
VITE_API_URL=http://localhost:8080
```

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register new user (company/investor) |
| `POST` | `/api/auth/login` | Login and receive JWT token |

### Company Portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/company/upload` | Upload report (multipart/form-data) |
| `GET` | `/api/company/dashboard?range=1y` | Dashboard data with time filtering |
| `GET` | `/api/company/reports?page=1&limit=10&search=` | Paginated reports list |
| `GET` | `/api/company/reports/:id` | Single report with all 11 metrics |
| `GET` | `/api/company/reports/:id/export` | Download ESG report as PDF |
| `GET` | `/api/company/reports/:id/download` | Download original uploaded file |
| `GET` | `/api/company/profile` | Get company profile |
| `PUT` | `/api/company/profile` | Update company profile |

### Flask ML Service

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check + list of required metrics |
| `POST` | `/extract` | Extract ESG metrics from uploaded PDF |

---

## 🗃 Database Schema

```mermaid
erDiagram
    users ||--o| companies : "has"
    users ||--o| investor_profiles : "has"
    companies ||--o{ reports : "uploads"
    reports ||--o{ esg_metrics : "contains"
    reports ||--o| esg_scores : "has"
    reports ||--o{ ai_recommendations : "generates"

    users {
        int id PK
        string name
        string email UK
        string password_hash
        string role
    }
    companies {
        int id PK
        int user_id FK
        string name
        string industry
        string country
        string market_cap
    }
    reports {
        int id PK
        int company_id FK
        string file_name
        string file_type
        string file_url
        string status
    }
    esg_metrics {
        int id PK
        int report_id FK
        string metric_name
        numeric metric_value
        string metric_unit
    }
    esg_scores {
        int id PK
        int report_id FK
        numeric environmental
        numeric social
        numeric governance
        numeric overall_score
        string grade
    }
```

---

## 🧠 ML Pipeline

The ESG metric extraction pipeline operates in multiple stages:

```
PDF Upload
    │
    ▼
┌──────────────┐
│  PDF Parser  │  pdfplumber extracts raw text + tables
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Table Recon-     │  Reconstructs broken table rows,
│ structor         │  handles multi-line cells, merged headers
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Text Chunking    │  Splits content into ESG-relevant chunks
│ + Filtering      │  with numeric value requirements
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ NER Model        │  RoBERTa-based Named Entity Recognition
│ (Token Classify) │  identifies metric mentions
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Classifier Model │  Multi-label classification assigns
│ (Sequence)       │  chunks to metric categories
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Value Extraction │  Regex + rule-based extraction of
│ + Validation     │  numeric values with unit detection
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Master Prompt    │  Aggregates, deduplicates, selects
│ Resolution       │  best value per metric
└──────┬───────────┘
       │
       ▼
  11 ESG Metrics (raw values)
```

### Training the Models

```bash
cd Server/Flask

# Step 1: Generate training dataset
python generate_esg_dataset.py

# Step 2: Transform data for training
python phase1_data_transformation.py

# Step 3: Train NER + Classifier models
python phase2_model_training.py

# Step 4: Evaluate and test
python phase3_6_evaluation_robustness.py
```

---

## 🖼 Screenshots

> Screenshots can be added by placing images in a `/screenshots` directory and referencing them here.

| Page | Description |
|------|-------------|
| Dashboard | ESG scores, emissions pie chart, trend lines, KPIs, AI recommendations |
| Upload | Drag-and-drop zone, processing queue, all 11 metrics preview |
| Report Detail | Full metric breakdown by category, ESG score bars, PDF export |
| History | Paginated report cards with search, ESG score badges |
| Settings | Company profile form with country/industry dropdowns |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is developed as a **B.E. Major Project** at **DJSCE (Dwarkadas J. Sanghvi College of Engineering)**, Semester 7.

---

<p align="center">
  <strong>Built with 💚 by the EcoLens Team</strong>
</p>
