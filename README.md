# VCE Pali — e-Gram Digital Services & Financial Ledger

> **Dedicated Management & Financial Ledger System for Village Computer Entrepreneurs (VCE)** operating at the Pali e-Gram Kendra under the **e-Gram Vishwagram Project** (Department of Panchayats, Rural Housing and Rural Development, Government of Gujarat).

---

## 🏛️ Background & Purpose

In rural governance, a **VCE (Village Computer Entrepreneur)** operates from the local **e-Gram Kendra** situated inside the Gram Panchayat office under a Public-Private Partnership (PPP) model. VCEs are the grassroots digital backbone delivering essential Government-to-Citizen (G2C) and Business-to-Citizen (B2C) e-governance services to rural citizens, farmers, and pensioners.

This application is purpose-built to solve the exact operational, portal, and financial challenges faced daily by VCE Pali e-Gram center operators.

---

## 🌟 Key Domain Features

### 1. Official Gujarat Services Catalog
- Pre-configured with official Gujarat e-governance services:
  - **Land Records / AnyRoR**: 7/12 & 8-A extracts, VF-6 Hak Patrak mutation entries.
  - **Digital Gujarat Certificates**: Income Certificate, Caste Certificate (SC/ST/SEBC/EWS), Non-Creamy Layer (NCL), Domicile.
  - **Social Welfare & Pensions**: Ganga Swarupa Widow Pension, Niradhar Vrudh Old-Age Pension, Divyang assistance.
  - **Agriculture / iKhedut & PM-Kisan**: Farm implements subsidies (tractor, drip irrigation, wire fencing, pipeline), PM-Kisan e-KYC, MSP procurement registration.
  - **Civil Supplies (Ration Card)**: New ration card application, member addition/deletion, separation.
  - **Panchayat & Civic**: Birth & Death Certificates, Pedhinama, Gram Panchayat House Tax.
  - **Health & Utility**: Ayushman Bharat PM-JAY cards, Voter ID (Form 6/7/8), UGVCL/PGVCL/DGVCL/MGVCL electricity bills.

### 2. Mandated Minimum ₹20/Unit Government Work Orders Tracker
- In **December 2025**, Gujarat Chief Minister Bhupendra Patel mandated a **minimum payment of ₹20 per unit/entry** for all tasks assigned to VCEs by State Government departments (Health, Agriculture, Election/BLO, Animal Husbandry, Sports).
- Dedicated tracker for bulk department campaigns (target entries, completed entries, claim status).
- **1-Click Claim Voucher / Bill Generator**: Ready-to-print official invoice for submission to the Taluka Development Officer (TDO) and Taluka Panchayat.

### 3. Daily Cash Book (Daily Rojmel)
- Traditional Gujarat Gram Panchayat daily accounting daybook:
  - Opening Cash in Drawer + Opening Bank/UPI balance
  - Today's Inflows (Citizen cash, UPI collections, government claim disbursements)
  - Today's Outflows (Center overheads, portal wallet top-ups)
  - Daily Udhar Movement (new credit given vs recovered)
  - Closing Cash in Hand & Bank balance
  - 1-Click Printable Daily Rojmel Sheet.

### 4. Prepaid Portal Wallets Ledger
- Live balance tracking for prepaid portals where deductions occur per application:
  - **Digital Gujarat Portal Wallet**
  - **AnyRoR Land Records Wallet**
  - **CSC Digital Seva Wallet**
  - **Discom Electricity Float**
- Low-balance alerts and 1-click recharge/top-up logging with UTR/UPI reference.

### 5. Citizens & Farmers Udhar Ledger
- Rural citizen directory with village/faliyu, mobile number, land khata number, ration card number, and citizen category (Farmer, Pensioner, Student, General).
- Track outstanding Udhar balances per resident.
- **1-Click WhatsApp Payment Reminder**: Automatically formats and opens WhatsApp asking for pending fee settlement.

### 6. Token & Receipt Management
- Auto-generated token numbers (`TK-YYYYMMDD-XXXX`) for every citizen application.
- Printable acknowledgment token receipt for applicants to present when collecting digitally signed certificates.

### 7. Financial Precision Engine
- **Integer-Paise Core**: Zero IEEE-754 floating-point rounding errors. Stored in integer paise, formatted in Indian numbering (`₹1,25,000.00`).
- **Fee Split Matrix**: Automatically tracks Citizen Fee, Portal Cost (deducted from wallet), Gram Panchayat Share, and Net VCE Earnings.
- **1-Click Exporting**: Instant export to **CSV**, **Excel (.xlsx)**, and **PDF**.

---

## 🏗️ Technical Architecture

```
VCE/
├── frontend/          # Single Page App (Clean Minimal English UI)
│   ├── index.html     # SPA Router
│   ├── pages/         # dashboard, work (applications), people (citizens), rojmel, gov_claims, transactions, expenses, reports, settings
│   ├── css/           # reset, variables, layout, components, responsive
│   ├── js/            # api, app, dashboard, work, people, rojmel, gov_claims, expenses, reports, settings
│   └── components/    # sidebar, navbar, modal, notification, empty_state
│
├── backend/           # Python 3.12 + FastAPI + SQLite (WAL Mode)
│   ├── main.py        # Application entrypoint
│   ├── api/           # vce, work, people, payments, expenses, dashboard, reports, settings
│   ├── core/          # config, security, exceptions
│   ├── database/      # SQLite connection, schema migrations, parameterized queries
│   ├── schemas/       # Pydantic v2 data models (vce, work, person, dashboard, etc.)
│   ├── services/      # business logic & financial calculations
│   └── utils/         # paise money formatting, dates, CSV/Excel/PDF exporters
│
├── database/          # SQLite storage
│   ├── vce.db         # Relational database with foreign keys & indexes
│   ├── backups/       # Automated timestamped database backups
│   └── seeds/         # Authentic Gujarat e-Gram demo dataset
│
├── scripts/           # Windows automation & maintenance
│   ├── seed_database.py
│   ├── backup_database.py
│   ├── reset_database.py
│   └── run.bat
│
└── tests/             # Automated test suite (Pytest)
    ├── backend/       # Unit & VCE feature tests
    └── integration/   # Acceptance scenario tests
```

---

## 🚀 Quick Start

### 1. Requirements
- Python 3.10+ (Tested with Python 3.12)
- Modern Web Browser (Edge, Chrome, Firefox)

### 2. Run the Application
Double-click `run.bat` or run:
```powershell
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser at:
```
http://127.0.0.1:8000
```

### 3. Run Automated Tests
```powershell
pytest -v tests/
```

### 4. Seed Realistic Gujarat e-Gram Demo Data
```powershell
python scripts/seed_database.py
```
