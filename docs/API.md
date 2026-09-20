# VCE Work & Money Flow Tracker — REST API Documentation

The backend exposes a structured, typed REST API using FastAPI. Interactive Swagger UI is available at `http://127.0.0.1:8000/docs` and ReDoc at `http://127.0.0.1:8000/redoc`.

---

## Base URL
```
http://127.0.0.1:8000/api
```

---

## 1. People / Clients (`/api/people`)
- `POST /api/people`: Create a new person/client.
  - Body: `{ name: str, phone?: str, email?: str, company?: str, address?: str, notes?: str, tags?: str }`
- `GET /api/people`: List all clients with dynamically computed financial totals (`total_agreed`, `total_received`, `total_pending`).
  - Query: `q` (search name/phone/company), `include_archived` (boolean).
- `GET /api/people/{id}`: Get single person with all financial statistics.
- `GET /api/people/{id}/detail`: Full client dossier with complete work and payment history arrays.
- `PUT /api/people/{id}`: Update person attributes.
- `DELETE /api/people/{id}`: Soft-archive if linked transactions exist, otherwise hard delete.

---

## 2. Work & Tasks (`/api/work`)
- `POST /api/work`: Create a new work record.
  - Body: `{ person_id: int, title: str, agreed_amount: int (paise), category?: str, status?: str, deadline?: str, description?: str }`
- `GET /api/work`: Filterable work items list.
  - Query: `person_id`, `status`, `category`, `priority`, `deadline_from`, `deadline_to`, `q`.
- `GET /api/work/{id}`: Work item with dynamic `received_amount` and `pending_amount`.
- `GET /api/work/{id}/timeline`: Complete lifecycle timeline: Person → Work → Agreed Amount → Payments → Pending Balance → Status Activity Log.
- `PUT /api/work/{id}`: Update work details or status.
- `DELETE /api/work/{id}`: Safe delete/archive.

---

## 3. Payments / Income (`/api/payments`)
- `POST /api/payments`: Record a received payment or Udhar entry.
  - Body: `{ person_id: int, work_id?: int, amount: int (paise), payment_method: str, payment_date: str, payment_time: str, transaction_reference?: str, notes?: str }`
- `GET /api/payments`: List payments.
  - Query: `person_id`, `work_id`, `payment_method`, `payment_status`, `date_from`, `date_to`, `min_amount`, `max_amount`, `q`.
- `GET /api/payments/{id}`: Payment details.
- `PUT /api/payments/{id}`: Update payment record.
- `DELETE /api/payments/{id}`: Delete payment with activity logging.

---

## 4. Expenses (`/api/expenses`)
- `POST /api/expenses`: Record an operational or business expense.
  - Body: `{ title: str, amount: int (paise), category_id?: int, payment_method?: str, expense_date: str, expense_time: str, vendor?: str, notes?: str }`
- `GET /api/expenses`: List expenses with filters (`category_id`, `vendor`, `date_from`, `date_to`, `q`).
- `PUT /api/expenses/{id}`: Update expense.
- `DELETE /api/expenses/{id}`: Delete expense.

---

## 5. Dashboard & Analytics (`/api/dashboard`)
- `GET /api/dashboard`: Aggregated dashboard metrics.
  - Query: `preset` (`today`, `yesterday`, `this_week`, `this_month`, `this_year`, `all`, `custom`), `start_date`, `end_date`.
  - Returns:
    - Today's revenue, expenses, profit, work count.
    - Period revenue, expenses, profit, expected accrued profit.
    - Total outstanding / Udhar.
    - 7-day revenue vs expense trend points.
    - Category & payment method breakdown percentages.
    - Today's work and upcoming deadlines.

---

## 6. Unified Search (`/api/search`)
- `GET /api/search`: Parameterized multi-factor search across people, work, payments, and expenses.
  - Query: `q`, `types` (`work`, `payment`, `expense`, `person`), `preset`, `date_from`, `date_to`, `min_amount`, `max_amount`, `payment_method`, `status`.

---

## 7. Reports & File Exports (`/api/reports`)
- `GET /api/reports`: Report data for on-screen display.
  - Types: `revenue`, `expense`, `profit`, `person_wise`, `work_wise`, `outstanding`, `payment_method`.
- `GET /api/reports/export`: Generates downloadable files:
  - Formats: `csv`, `excel` (`.xlsx`), `pdf`.

---

## 8. Custom Settings (`/api/settings`)
- Work categories, expense categories, payment methods, and work statuses CRUD endpoints.
