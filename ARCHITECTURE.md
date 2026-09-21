VCE Work & Money Flow Tracker — Architecture
1. Architecture Decision
The project shall use a three-layer application architecture:

VCE
├── frontend/      # HTML, CSS, JavaScript only
├── backend/       # Python backend/API + business logic
├── database/      # SQLite database and database-related files
└── project-level files
Primary technology decision
Layer	Technology	Purpose
Frontend	HTML + CSS + JavaScript	UI, forms, tables, dashboard, search/filter interaction
Backend	Python	API, business logic, validation, calculations, authentication
Database	SQLite	Persistent structured application data
Configuration	.env / config files	Environment-specific settings and secrets
Documentation	.md	Project instructions and architecture
Scripts	.bat / .py	Development, database, backup, build, or maintenance automation
2. Why SQLite Instead of JSON?
Decision: SQLite
SQLite should be the source of truth for application data.

The application contains related structured information:

Person
   ↓
Work
   ↓
Payment
   ↓
Pending Amount

Expense
   ↓
Profit calculation

All records
   ↓
Date/Time
   ↓
Search + Filter + Reports
This is exactly the type of data that benefits from a relational database.

SQLite advantages for this project
Relationships
A payment can belong to:

a person

a work item

a specific date/time

SQLite handles these relationships naturally.

Search
The application needs searches such as:

Person = Raj
AND
Payment Method = Online
AND
Amount >= ₹5,000
AND
Date = September 2026
SQLite can perform these queries efficiently.

Aggregation
The dashboard needs:

SUM(revenue)
SUM(expenses)
SUM(pending)
COUNT(active_work)
SQLite is designed for this.

Data integrity
SQLite supports:

primary keys

foreign keys

unique constraints

indexes

transactions

controlled updates

This is especially important for financial records.

Single-file database
The complete database can initially be stored as:

database/vce.db
There is no need to install a separate database server for the first version.

3. Why JSON Should Not Be the Main Database
JSON is useful, but it should not be the primary storage system for this project.

Example of JSON-based storage:

{
  "people": [],
  "work": [],
  "payments": [],
  "expenses": []
}
This looks simple initially, but becomes problematic as the application grows.

Problems include:

difficult relational queries

weak data integrity

difficult concurrent writes

inefficient filtering as data grows

greater risk of accidental file corruption

difficult aggregation

no proper foreign-key enforcement

harder partial updates

harder indexing

Therefore:

Do not store the application's primary financial/work records in JSON.

4. Where JSON Can Be Used
JSON can still be used where appropriate.

Examples:

frontend/config/
backend/config/
exports/
imports/
Possible uses:

UI configuration

default settings

import/export format

temporary API payloads

seed/demo data

application metadata

backup interchange format

But these JSON files must not replace SQLite as the source of truth.

5. Recommended Root Directory
The root directory should be:

VCE/
│
├── frontend/
├── backend/
├── database/
├── docs/
├── scripts/
├── tests/
│
├── .env.example
├── .gitignore
├── README.md
├── PROJECT.md
├── REQUIREMENTS.md
├── ARCHITECTURE.md
│
└── run.bat
The root should contain only files that belong to the whole project.

Do not put frontend files, backend Python files, or random data files directly in the root.

6. Frontend Architecture
Directory
frontend/
The frontend directory shall contain frontend-related files only.

Recommended structure:

frontend/
│
├── index.html
│
├── pages/
│   ├── dashboard.html
│   ├── work.html
│   ├── people.html
│   ├── transactions.html
│   ├── reports.html
│   ├── savings.html
│   └── settings.html
│
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── components.css
│   ├── layout.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── api.js
│   ├── dashboard.js
│   ├── work.js
│   ├── people.js
│   ├── transactions.js
│   ├── expenses.js
│   ├── reports.js
│   ├── savings.js
│   └── settings.js
│
├── components/
│   ├── navbar.js
│   ├── sidebar.js
│   ├── modal.js
│   ├── table.js
│   ├── form.js
│   └── notification.js
│
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
Frontend rules
Frontend may contain:

HTML

CSS

JavaScript

images

icons

fonts

frontend-only configuration

Frontend must not contain:

Python

SQLite database

database credentials

secret API keys

business-critical calculations that must be trusted

direct database access

The browser communicates with the backend API.

Browser
   ↓
HTTP/API
   ↓
Python Backend
   ↓
SQLite
7. Backend Architecture
Directory
backend/
The backend contains Python application code and backend-only resources.

Recommended structure:

backend/
│
├── main.py
│
├── api/
│   ├── __init__.py
│   ├── people.py
│   ├── work.py
│   ├── payments.py
│   ├── expenses.py
│   ├── savings.py
│   ├── dashboard.py
│   ├── reports.py
│   └── search.py
│
├── models/
│   ├── __init__.py
│   ├── person.py
│   ├── work.py
│   ├── payment.py
│   ├── expense.py
│   └── savings.py
│
├── schemas/
│   ├── person.py
│   ├── work.py
│   ├── payment.py
│   ├── expense.py
│   └── savings.py
│
├── services/
│   ├── person_service.py
│   ├── work_service.py
│   ├── payment_service.py
│   ├── expense_service.py
│   ├── dashboard_service.py
│   ├── report_service.py
│   └── search_service.py
│
├── database/
│   ├── connection.py
│   ├── queries.py
│   └── migrations.py
│
├── core/
│   ├── config.py
│   ├── security.py
│   ├── validation.py
│   └── exceptions.py
│
└── utils/
    ├── dates.py
    ├── money.py
    └── exports.py
Backend responsibilities
The backend is responsible for:

API endpoints

validation

authentication

authorization

database operations

business rules

financial calculations

search

filtering

reporting

export generation

error handling

data integrity

8. Database Architecture
Directory
database/
This folder contains persistent data and database-specific files only.

Recommended structure:

database/
│
├── vce.db
│
├── backups/
│   ├── .gitkeep
│   └── ...
│
├── seeds/
│   ├── demo_data.json
│   └── default_categories.json
│
└── README.md
Important rule
The SQLite database file is:

database/vce.db
It is the application's primary source of truth.

Do not create separate JSON files such as:

database/people.json
database/work.json
database/payments.json
database/expenses.json
for live application data.

That would duplicate the source of truth and create synchronization problems.

9. SQLite Database Schema
The initial database should contain tables similar to:

users
people
work
payments
expense_categories
expenses
savings
work_categories
payment_methods
work_statuses
tags
activity_log
settings
Important relationships:

people
  │
  ├──────────< work
  │             │
  │             └──────────< payments
  │
  └──────────< payments


work
  │
  └──────────< payments


expense_categories
  │
  └──────────< expenses


work
  │
  └──────────< expenses   (optional)
10. Database File Rules
Live database
database/vce.db
Backup database
Backups may be stored in:

database/backups/
Example:

database/backups/vce_2026-09-20_10-30-00.db
Backups should not be used by the application as the active database.

Temporary database files
SQLite may generate temporary/journal files depending on configuration.

These should not be treated as application source files.

The application should configure SQLite appropriately and .gitignore database-generated temporary files where necessary.

11. Data Flow
Create Work
Frontend
   │
   │ POST /api/work
   ↓
Backend API
   │
   ├── Validate data
   ├── Verify person
   ├── Validate amount
   └── Apply business rules
   │
   ↓
SQLite
   │
   └── work table
Receive Payment
Frontend
   │
   │ POST /api/payments
   ↓
Backend
   │
   ├── Validate amount
   ├── Verify person
   ├── Verify work
   ├── Validate payment method
   └── Save timestamp
   │
   ↓
SQLite
   │
   └── payments table
Dashboard
Frontend
   │
   │ GET /api/dashboard?from=...&to=...
   ↓
Backend
   │
   ├── Query payments
   ├── Query expenses
   ├── Calculate revenue
   ├── Calculate expenses
   ├── Calculate profit
   ├── Calculate pending
   └── Query work
   │
   ↓
JSON API Response
   │
   ↓
Frontend Dashboard
12. Source of Truth Rule
There must be one authoritative source for each type of live data.

People       → SQLite
Work         → SQLite
Payments     → SQLite
Expenses     → SQLite
Savings      → SQLite
Settings     → SQLite/config depending on requirement
Frontend state is temporary.

JSON API responses are temporary.

Cached data is temporary.

SQLite is authoritative.

13. Money Handling
Money must not be stored using JavaScript floating-point calculations as the authoritative value.

The backend/database should use a precise representation.

Recommended approach for this project:

amount stored as integer paise
Example:

₹1,250.50
=
125050 paise
This avoids common floating-point precision problems.

The frontend can convert the stored value into:

₹1,250.50
The exact implementation may alternatively use a database-supported precise decimal strategy, but the project must maintain exact monetary calculations.

14. Date and Time Handling
Store important timestamps consistently.

Recommended database approach:

created_at
updated_at
event_date
event_time
For events such as payments and expenses, the actual event time must be preserved separately from the record creation time.

Example:

created_at = when the record was entered
payment_date = when money was actually received
payment_time = when money was actually received
This allows the user to enter historical transactions correctly.

15. API Boundary
The frontend must never directly access SQLite.

Incorrect:

HTML/JS
   ↓
SQLite
Correct:

HTML/CSS/JS
   ↓
Python API
   ↓
Database service
   ↓
SQLite
This protects:

database credentials

validation

business rules

authorization

data integrity

16. Search Architecture
Search should be performed primarily by the backend/database.

Example:

User enters:
"Raj"
      ↓
Frontend
      ↓
GET /api/search?q=Raj
      ↓
Python backend
      ↓
SQLite query
      ↓
Filtered results
      ↓
Frontend
For advanced filtering:

GET /api/transactions?
person_id=12
min_amount=5000
payment_method=online
from=2026-09-01
to=2026-09-20
The backend should construct safe parameterized queries.

Never concatenate raw user input directly into SQL.

17. Indexing
SQLite indexes should be added to fields frequently used for searching/filtering.

Potential indexes:

people.name
people.phone

work.person_id
work.status
work.deadline
work.created_at

payments.person_id
payments.work_id
payments.payment_method
payments.payment_date
payments.amount

expenses.category_id
expenses.expense_date
expenses.amount
Indexes should be added based on actual query patterns rather than indiscriminately indexing every column.

18. Backend vs Database Responsibilities
Backend
The backend decides:

Is this payment valid?

Does this person exist?

Does this work exist?

Is the user authorized?

What is the current pending amount?

What is revenue?

What is profit?

Which records match the requested filter?

Database
The database guarantees:

Data persistence

Relationships

Constraints

Transactions

Indexing

Reliable storage

Do not move critical business rules entirely into frontend JavaScript.

19. Project-Level Files
The root may contain:

PROJECT.md
REQUIREMENTS.md
ARCHITECTURE.md
README.md
.env.example
.gitignore
run.bat
PROJECT.md
Defines:

product purpose

user

workflow

features

product rules

scope

REQUIREMENTS.md
Defines:

functional requirements

technical requirements

validation

security

acceptance criteria

ARCHITECTURE.md
Defines:

folder structure

technology boundaries

data flow

database strategy

architecture rules

README.md
Defines:

how to install

how to run

how to develop

common commands

.env.example
Contains example environment variable names only.

Never place real secrets in it.

20. Scripts Directory
Use:

scripts/
for project-wide automation.

Possible files:

scripts/
├── setup.bat
├── run.bat
├── backup_database.py
├── seed_database.py
├── reset_database.py
└── check_project.py
Only add scripts when they have a real purpose.

Do not create unnecessary scripts just to make the project look complete.

21. Tests Directory
Use:

tests/
for automated tests.

Possible structure:

tests/
├── backend/
│   ├── test_people.py
│   ├── test_work.py
│   ├── test_payments.py
│   ├── test_expenses.py
│   └── test_reports.py
│
└── integration/
    └── test_work_payment_flow.py
Critical financial calculations should have automated tests.

Especially:

agreed amount
- received payments
= pending amount
and:

received revenue
- expenses
= profit
22. Documentation Directory
Use:

docs/
for detailed supporting documentation.

Possible:

docs/
├── API.md
├── DATABASE.md
├── DEPLOYMENT.md
├── SECURITY.md
└── USER_GUIDE.md
Do not put documentation inside frontend/, backend/, or database/ unless it specifically documents that component.

23. What Must NOT Go Where
Do not put Python in frontend
Bad:

frontend/
└── database.py
Do not put HTML in backend
Bad:

backend/
└── dashboard.html
unless a future server-side rendering architecture explicitly requires it.

Do not put SQLite in frontend
Bad:

frontend/
└── vce.db
Do not store live financial data as JSON
Bad:

database/
├── people.json
├── payments.json
└── expenses.json
Do not put secrets in frontend
Bad:

frontend/js/config.js
containing:

API_SECRET=...
DATABASE_PASSWORD=...
Do not put random files in root
Avoid:

VCE/
├── test123.py
├── old.html
├── backup.zip
├── random.json
└── screenshot.png
Move useful artifacts to the appropriate folder or remove them.

24. Recommended Final Structure
The initial project should target:

VCE/
│
├── frontend/
│   ├── index.html
│   ├── pages/
│   ├── css/
│   ├── js/
│   ├── components/
│   └── assets/
│
├── backend/
│   ├── main.py
│   ├── api/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   ├── database/
│   ├── core/
│   └── utils/
│
├── database/
│   ├── vce.db
│   ├── backups/
│   ├── seeds/
│   └── README.md
│
├── docs/
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   └── SECURITY.md
│
├── scripts/
│   ├── setup.bat
│   ├── run.bat
│   ├── backup_database.py
│   └── seed_database.py
│
├── tests/
│   ├── backend/
│   └── integration/
│
├── .env.example
├── .gitignore
├── README.md
├── PROJECT.md
├── REQUIREMENTS.md
└── ARCHITECTURE.md
25. Final Architecture Rule
The project must follow this dependency direction:

┌──────────────────────────┐
│        FRONTEND          │
│      HTML/CSS/JS         │
└────────────┬─────────────┘
             │ HTTP/API
             ▼
┌──────────────────────────┐
│         BACKEND          │
│          Python          │
│ API + Business Logic     │
│ Validation + Security    │
└────────────┬─────────────┘
             │ Database access
             ▼
┌──────────────────────────┐
│        DATABASE          │
│          SQLite          │
│        vce.db            │
└──────────────────────────┘
The database is the persistent source of truth.

The backend is the trusted business-logic layer.

The frontend is the presentation and user-interaction layer.

JSON is an interchange/configuration format when useful, not the primary live database.

Do not introduce additional technologies, folders, services, or dependencies unless an actual project requirement justifies them.

