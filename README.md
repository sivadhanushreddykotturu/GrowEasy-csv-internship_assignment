# GrowEasy CSV Importer

An AI-powered CSV importer that intelligently extracts CRM lead information from any valid CSV format using Groq AI (free tier).

## Features

- 📤 **Drag & Drop** CSV upload (or file picker)
- 👁️ **Live Preview** of uploaded rows before processing
- 🤖 **AI-Powered Extraction** using Groq (Llama 3.3 70B)
- 🗺️ **Smart Column Mapping** — works with any CSV format
- 📊 **Results Dashboard** with stats and color-coded status badges
- 📥 **CSV Export** of extracted CRM records
- 🌙 **Dark Mode** (auto via system preference)
- ⚡ **Batch Processing** with retry and rate-limit handling

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Backend | Node.js + Express (TypeScript) |
| AI | Groq API — `llama-3.3-70b-versatile` |
| CSV Parsing | `csv-parse` (backend) + PapaParse (frontend) |
| File Upload | `react-dropzone` + Multer |

## Prerequisites

- Node.js 18+
- A free [Groq API key](https://console.groq.com) (no credit card required)

## Setup

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure API Key

Edit `backend/.env` and add your Groq API key:

```env
GROQ_API_KEY=gsk_your_key_here
PORT=3001
```

### 3. Run

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

Then open http://localhost:3000 in your browser.

## Test CSV Files

Three sample CSVs are included in `test-csvs/`:

| File | Description |
|------|-------------|
| `facebook_leads.csv` | Facebook Lead Ads export format |
| `realestate_crm.csv` | Real estate CRM with property fields |
| `messy_spreadsheet.csv` | Tab-separated with abbreviations & extra columns |

## API

### `POST /api/import`
Upload a CSV file for AI extraction.

**Request:** `multipart/form-data` with field `file` (CSV)

**Response:**
```json
{
  "success": true,
  "data": [ /* CRM records */ ],
  "skipped": 1,
  "total": 10,
  "processed": 9
}
```

### `GET /api/health`
Health check.

## CRM Fields Extracted

`created_at`, `name`, `email`, `country_code`, `mobile_without_country_code`, `company`, `city`, `state`, `country`, `lead_owner`, `crm_status`, `crm_note`, `data_source`, `possession_time`, `description`

## AI Strategy

The backend uses a **two-phase approach** for maximum accuracy:

1. **Schema Discovery** (1 API call): Sends CSV headers + 3 sample rows → AI identifies column mapping
2. **Batch Extraction** (1 call per 10 rows): Uses the discovered mapping to extract CRM records

This dramatically reduces tokens and improves accuracy on ambiguous column names.

## Rate Limiting

Groq free tier: 30 req/min, 30k tokens/min.
The backend automatically:
- Batches 10 rows per API call
- Adds 600ms delay between batches
- Retries up to 3 times with exponential backoff
