Work & Money Flow Tracker — Requirements
1. Functional Requirements
FR-001 — User Access
The system shall provide secure access for the owner/user when authentication is enabled.

FR-002 — Person Management
The user shall be able to create, view, edit, archive, and search people.

FR-003 — Work Creation
The user shall be able to create work records with person, title, description, agreed amount, status, dates, deadline, and notes.

FR-004 — Work Status
The system shall support configurable work statuses and allow the user to change a work item's status.

FR-005 — Payment Recording
The user shall be able to record payments against a person and optionally against a specific work item.

FR-006 — Payment Method
Each payment shall have a payment method. The initial methods shall include Online, Cash, and Udhar, with support for custom methods.

FR-007 — Payment Date and Time
Each payment shall preserve the actual payment/event date and time, plus system creation/update timestamps.

FR-008 — Partial Payments
A single work item shall support multiple partial payments.

FR-009 — Pending Amount
The system shall calculate outstanding amount from agreed work value minus linked received payments where applicable.

FR-010 — Expense Recording
The user shall be able to create, edit, archive/delete, and search expenses.

FR-011 — Expense Categories
Expense categories shall be configurable by the user.

FR-012 — Revenue Calculation
The system shall calculate received revenue for the selected period from valid received payment records.

FR-013 — Expense Calculation
The system shall calculate total expenses for the selected period.

FR-014 — Profit Calculation
The system shall calculate basic cash-flow profit as:

received revenue - expenses

FR-015 — Outstanding/Udhar
The system shall show money that remains pending separately from received revenue.

FR-016 — Savings
The system shall support savings records independently from revenue and profit.

FR-017 — Today's Work
The system shall provide a dedicated view of work due or scheduled for today.

FR-018 — Upcoming Work
The system shall show upcoming work and deadlines.

FR-019 — Work Detail
The user shall be able to open a work item and see its person, amount, payment history, pending amount, status, dates, and notes.

FR-020 — Person Detail
The user shall be able to open a person and see their work, payments, total received, total pending, and historical activity.

2. Search Requirements
SR-001 — Global Search
The application shall provide a global search across relevant work, people, payments, and expenses.

SR-002 — Person Search
The user shall be able to search by person name, phone, or company.

SR-003 — Work Search
The user shall be able to search by work title, description, category, and status.

SR-004 — Amount Search
The user shall be able to search using:

exact amount

minimum amount

maximum amount

amount range

SR-005 — Date Search
The user shall be able to filter by:

exact date

today

yesterday

week

month

year

custom date range

SR-006 — Time Search
Where time is stored, the user shall be able to filter by time range.

SR-007 — Payment Method Search
The user shall be able to filter by Online, Cash, Udhar, and custom payment methods.

SR-008 — Record Type Search
The user shall be able to filter by:

work

income/payment

expense

pending/udhar

SR-009 — Combined Filters
Multiple filters shall work together.

SR-010 — Sorting
Results shall be sortable by:

newest

oldest

highest amount

lowest amount

deadline

name

status

3. Dashboard Requirements
DR-001
The dashboard shall display today's revenue.

DR-002
The dashboard shall display today's expenses.

DR-003
The dashboard shall display today's profit.

DR-004
The dashboard shall display current outstanding/udhar amount.

DR-005
The dashboard shall display active work count.

DR-006
The dashboard shall display today's work.

DR-007
The dashboard shall provide a selectable/custom date range.

DR-008
Dashboard totals shall update when the selected date range changes.

DR-009
Dashboard analytics shall include revenue vs expense trends.

DR-010
Dashboard shall provide quick actions for:

Add Work

Add Payment

Add Expense

Add Person

4. Reports Requirements
RR-001
The system shall generate revenue reports.

RR-002
The system shall generate expense reports.

RR-003
The system shall generate profit reports.

RR-004
The system shall generate person-wise financial reports.

RR-005
The system shall generate work-wise financial reports.

RR-006
The system shall generate outstanding/udhar reports.

RR-007
The system shall generate payment-method reports.

RR-008
Reports shall support custom date ranges.

RR-009
Reports shall support filtering.

RR-010
Reports shall support CSV/Excel export.

RR-011
PDF export should be supported where technically practical.

5. Data Requirements
DATA-001 — Person
Minimum fields:

id

name

phone (optional)

email (optional)

company (optional)

notes

created_at

updated_at

DATA-002 — Work
Minimum fields:

id

person_id

title

description

category

agreed_amount

status

priority

start_date

deadline

completed_date

notes

created_at

updated_at

DATA-003 — Payment
Minimum fields:

id

person_id

work_id (optional)

amount

payment_method

payment_status

transaction_reference (optional)

payment_date

payment_time

notes

created_at

updated_at

DATA-004 — Expense
Minimum fields:

id

category_id

title

description

amount

payment_method

expense_date

expense_time

person/vendor (optional)

work_id (optional)

notes

created_at

updated_at

DATA-005 — Savings
Minimum fields:

id

title

target_amount

saved_amount

target_date

notes

created_at

updated_at

6. Validation Requirements
VAL-001
Amounts shall be positive unless a specific adjustment/refund model is implemented.

VAL-002
Required fields shall be validated on both frontend and backend.

VAL-003
Invalid dates shall be rejected.

VAL-004
Payment amounts shall not silently exceed the relevant work balance unless overpayment is explicitly supported.

VAL-005
Duplicate form submission shall not create duplicate financial transactions.

VAL-006
Calculated totals shall be derived from source records.

VAL-007
Currency calculations shall use precise decimal/numeric handling.

VAL-008
Destructive operations shall require confirmation.

7. Data Integrity Requirements
DI-001
Deleting a work record shall not silently delete financial records without an explicit defined rule.

DI-002
Historical payment timestamps shall remain preserved after edits.

DI-003
Changes to important records should be auditable.

DI-004
Relationships between people, work, and payments shall remain valid.

DI-005
Archived records shall remain recoverable where practical.

DI-006
The application shall handle missing/optional work links safely.

8. Security Requirements
SEC-001
Authentication shall be secure.

SEC-002
Passwords shall never be stored in plaintext.

SEC-003
All protected API endpoints shall verify authorization.

SEC-004
Users shall only access records belonging to their authorized account.

SEC-005
Production traffic shall use HTTPS.

SEC-006
Secrets/API keys shall not be exposed in frontend source code.

SEC-007
Server-side validation shall be mandatory even if frontend validation exists.

SEC-008
Sensitive financial information shall not be written to unnecessary logs.

SEC-009
Backups shall be considered for production deployment.

SEC-010
The user should be able to export and delete their data.

9. UI/UX Requirements
UX-001
The application shall be responsive on mobile, tablet, and desktop.

UX-002
The primary daily actions shall be easy to reach.

UX-003
Adding a payment should require minimal steps.

UX-004
Adding an expense should require minimal steps.

UX-005
Adding work should be fast but support detailed fields.

UX-006
Tables shall remain usable on small screens.

UX-007
Important totals shall have strong visual hierarchy.

UX-008
₹ formatting shall be consistent throughout the application.

UX-009
Dates and times shall be displayed consistently.

UX-010
The interface shall use clear empty states, loading states, error states, and success feedback.

UX-011
Animations shall be subtle, purposeful, and performance-conscious.

UX-012
The interface shall support keyboard navigation on desktop where practical.

UX-013
Color shall not be the only method used to communicate status.

10. Customization Requirements
CR-001
Users shall be able to create custom work categories.

CR-002
Users shall be able to create custom expense categories.

CR-003
Users shall be able to create custom payment methods.

CR-004
Users shall be able to configure work statuses.

CR-005
Users shall be able to use tags.

CR-006
Search/filter behavior shall not depend on hardcoded categories.

11. Performance Requirements
PERF-001
Dashboard calculations shall remain responsive as transaction history grows.

PERF-002
Search shall use indexed database fields where appropriate.

PERF-003
Large history lists shall use pagination or efficient virtualized rendering where appropriate.

PERF-004
Reports shall avoid loading unnecessary records into the browser.

PERF-005
The application shall not perform expensive calculations repeatedly when cached/aggregated data can safely be used.

12. Accessibility Requirements
A11Y-001
Forms shall have clear labels.

A11Y-002
Interactive controls shall have accessible names.

A11Y-003
Keyboard focus shall be visible.

A11Y-004
Text and UI controls shall maintain adequate contrast.

A11Y-005
Important information shall remain understandable without relying only on color.

A11Y-006
Reduced-motion preferences should be respected.

13. Audit/History Requirements
AUD-001
The system should record creation timestamps for financial and work records.

AUD-002
The system should record update timestamps.

AUD-003
Important changes should be represented in an activity/history timeline.

AUD-004
The user should be able to understand when and why a payment/work record changed where audit tracking is enabled.

14. Export Requirements
EXP-001
Users shall be able to export filtered transaction data.

EXP-002
Users shall be able to export work records.

EXP-003
Users shall be able to export person-wise summaries.

EXP-004
Users shall be able to export revenue/expense/profit reports.

EXP-005
Exported data shall retain dates, times, amounts, people, work references, and payment methods.

15. V1 Acceptance Criteria
The first release is acceptable when a real user can complete this flow:

Add a person named "Example Client".

Add work from that person.

Set agreed amount to ₹10,000.

Record ₹3,000 received online.

See ₹7,000 pending.

Record ₹2,000 received in cash later.

See ₹5,000 remaining.

Record a ₹500 work-related expense.

See received revenue of ₹5,000 for that work's payments.

See the expense in the selected period.

See profit as received revenue minus expenses.

Search the ₹3,000 payment.

Filter all cash payments.

Filter all records for the example client.

Open the work and see its payment timeline.

Search by date and amount.

Export the filtered records.

16. Future Requirements — Not V1
Potential later features:

Multi-user/team access

Customer portal

WhatsApp integration

Payment reminders

Automatic recurring work

Invoice generation

GST features

Inventory

Bank/UPI integrations

Mobile app

Offline-first synchronization

Receipt image storage

Voice-based quick entry

AI-assisted categorization

Automated monthly reports

These should not be implemented in V1 unless explicitly approved.

