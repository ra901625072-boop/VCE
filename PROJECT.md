# VCE Pali (Village Computer Entrepreneur) — Project Definition
## e-Gram Digital Services & Financial Ledger

### 1. Project Overview
This project is a specialized web application and financial ledger specifically designed for **Village Computer Entrepreneurs (VCEs)** operating at the **Pali e-Gram Kendra** under the **e-Gram Vishwagram Project** (Department of Panchayats, Rural Housing and Rural Development, Government of Gujarat).

The system tracks:
1. **Citizen & Farmer Profiles**: Village/faliyu, mobile number, land khata number, ration card number, citizen category.
2. **e-Gram Service Applications**: AnyRoR (7/12 & 8-A), Digital Gujarat certificates, iKhedut subsidies, ration cards, election cards, utility payments.
3. **Application Tokens & Acknowledgments**: Auto-generated token numbers (`TK-YYYYMMDD-XXXX`) and portal application IDs.
4. **Mandated ₹20/Unit State Govt Tasks**: Tracking survey and data entry drives under the December 2025 resolution by Gujarat CM Bhupendra Patel with 1-click Taluka claim invoice generation.
5. **Fee Breakdown & Realized Earning**: Citizen fee, government portal wallet deduction, Gram Panchayat revenue share, and net VCE commission.
6. **Payment Channels & Udhar**: Cash in hand, UPI, bank transfer, and village credit (Citizen Khata / Udhar).
7. **Prepaid Portal Wallets**: Digital Gujarat, AnyRoR, CSC Seva, and Discom deposit floats with low-balance alerts.
8. **Daily Cash Book (Daily Rojmel)**: Classical dual-entry daybook tracking opening cash/bank, daily receipts, center expenses (paper, toner, internet), wallet recharges, and closing cash in drawer.
9. **Statements & Exporting**: 1-click export to CSV, Excel, and PDF.

The core principle is:
Every service token, citizen application, cash transaction, portal wallet debit, and government claim must remain traceable to a citizen, portal, service category, date/time, and settlement status.

### 2. Primary User
The primary user is a Village Computer Entrepreneur (VCE) managing digital e-governance service delivery and center finances at the Pali Gram Panchayat.

3. Main Questions the Website Must Answer
At any time, the user should be able to answer:

Work
What work do I have today?

What work is pending?

What work is completed?

Who gave me this work?

When was the work given?

What is the deadline?

How much is this work worth?

How much have I received for this work?

How much is still pending?

Money
How much money did I receive today?

How much revenue did I generate this month?

How much did I spend today/month?

How much profit did I make?

How much money is still pending/udhar?

How much came through cash?

How much came through online payment?

How much is associated with each person?

Which work generated a particular payment?

History
What happened on a particular date?

What payments did I receive between two dates?

How much did a particular person give me?

What work did a particular person give me?

Find all records for a particular amount.

Find all cash/online/udhar records.

Find all work containing a keyword.

Find transactions created during a specific time period.

4. Core Data Model
The system should separate the concepts of Person, Work, Payment, Expense, and Savings while keeping relationships between them.

4.1 Person
Represents anyone connected to work or money.

Suggested fields:

id

name

phone

email

company/business name

address

notes

tags

created_at

updated_at

A person may give multiple work items and may make multiple payments.

4.2 Work
Represents a job/task/project given by someone.

Suggested fields:

id

person_id

title

description

category

agreed_amount

received_amount

pending_amount

status

priority

start_date

deadline

completed_date

notes

created_at

updated_at

Suggested statuses:

New

Planned

In Progress

Waiting

Completed

Cancelled

The application should calculate:

pending_amount = agreed_amount - total_linked_payments

The user should not need to manually maintain the pending amount.

4.3 Payment / Income
Represents money received from a person/work.

Suggested fields:

id

person_id

work_id (optional but strongly recommended when applicable)

amount

payment_method

payment_status

transaction_reference

payment_date

payment_time

notes

created_at

updated_at

Payment methods must be customizable, with initial defaults:

Online

Cash

Udhar

The system should allow future custom methods such as:

UPI

Bank Transfer

Cheque

Other

Important distinction:

Udhar should not automatically be treated as received money.

If ₹10,000 is agreed and ₹3,000 is actually received online while ₹7,000 remains pending, revenue/received cash flow should reflect the ₹3,000 received, while the remaining ₹7,000 is tracked as pending.

The exact accounting treatment should be configurable in the application.

4.4 Expense
Represents money spent by the user.

Suggested fields:

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

receipt/reference (optional)

notes

created_at

updated_at

Example categories:

Travel

Material

Tools

Food

Transport

Phone/Internet

Office

Salary/Labour

Other

All categories should be customizable.

4.5 Savings
Represents money intentionally set aside.

Suggested fields:

id

title

target_amount

saved_amount

target_date

notes

created_at

updated_at

Savings should be visible separately from profit.

The application should not incorrectly calculate savings as profit.

4.6 Work Activity / Timeline
Important actions should optionally create a timeline entry:

Work created

Work updated

Payment received

Expense added

Work completed

Payment edited

Payment deleted

Status changed

Each activity should contain:

timestamp

action

related record

short description

This provides a trustworthy history of changes.

5. Financial Definitions
The dashboard must clearly distinguish:

Revenue Received
Total money actually received from work/payment records during the selected period.

Outstanding / Udhar
Money associated with work that has been agreed but not yet received.

Expenses
Total recorded business/work expenses during the selected period.

Profit
For the basic cash-flow view:

Profit = Revenue Received - Expenses

A second optional metric may show:

Expected Profit = Total Agreed Work Value - Relevant Expenses

The UI must clearly label these so the user does not confuse received cash with expected income.

Savings
Money deliberately allocated toward savings.

Savings should be tracked independently from profit.

6. Dashboard
The dashboard should provide an immediate overview.

Primary cards
Today's Revenue

Today's Expenses

Today's Profit

Pending/Udhar

Active Work

Today's Work

Monthly Revenue

Monthly Expenses

Monthly Profit

Work section
Show:

Today's work

Upcoming deadlines

Pending work

Recently completed work

Money section
Show:

Recent payments

Recent expenses

Pending payments

Payment method breakdown

Analytics section
Useful charts:

Revenue vs Expenses

Profit trend

Revenue by month

Expenses by category

Payments by method

Outstanding amount trend

Work status distribution

All dashboard metrics must respect the selected date range/filter.

7. Work Management
The Work page should support:

Add work

Edit work

Delete/archive work

Change status

Set deadline

Assign person

Set agreed amount

Link payments

View payment history

Add notes

Search work

Filter work

Sort work

Work detail should show a complete timeline:

Person → Work → Agreed Amount → Payments → Remaining Amount → Status

8. People Management
The People page should provide a financial/work summary for every person.

For each person show:

Total work assigned

Total agreed amount

Total received

Total pending

Last payment

Last work

Active work count

Completed work count

Person detail should show:

Work history

Payment history

Outstanding amount

Total revenue

Notes

9. Money / Transactions
Create a unified transaction/history area where the user can inspect:

Income/payment records

Expenses

Pending/udhar records

Linked work

Linked person

Each record should clearly show:

Date

Time

Type

Person

Work

Amount

Payment method

Status

Notes

10. Advanced Search & Filtering
Search is a core requirement, not an optional feature.

The user should be able to search/filter by:

Date & Time
Today

Yesterday

This week

This month

This year

Custom date range

Exact date

Time range

Amount
Exact amount

Minimum amount

Maximum amount

Amount range

Person
Person name

Phone

Company

Work
Work title

Work description

Work category

Work status

Payment
Online

Cash

Udhar

Custom payment methods

Financial type
Revenue

Expense

Pending

Profit-related records

Combined filters
Filters must be combinable.

Example:

Show all online payments above ₹5,000 received from Raj between 1 September and 20 September.

Another example:

Show all expenses above ₹1,000 related to travel during this month.

The search system should support partial text matching and sorting.

11. Date and Time
Every important record must store:

created date

created time

relevant event date

relevant event time

updated date/time

The application should display dates/times in the user's configured timezone.

The user should be able to edit the event date/time when entering historical records.

12. Customization
The application should be highly customizable.

User-configurable items should include:

Work categories

Expense categories

Payment methods

Work statuses

Tags

Dashboard date range

Currency display

Date format

Default filters

Custom fields where practical

Avoid hardcoding business assumptions that make future customization difficult.

13. Reports
Reports should support custom date ranges.

Recommended reports:

Revenue report

Expense report

Profit report

Payment-method report

Person-wise report

Work-wise report

Outstanding/Udhar report

Daily summary

Monthly summary

Yearly summary

Reports should support:

On-screen viewing

Search/filter

CSV/Excel export

PDF export where practical

14. Data Integrity
Financial data must be handled carefully.

Requirements:

Never silently change historical transactions.

Confirm destructive actions.

Keep relationships between work and payments intact.

Prevent negative calculated pending amounts unless explicitly supported.

Recalculate totals from source records rather than trusting manually entered totals.

Validate amounts.

Store money using a precise numeric/decimal representation, not floating-point arithmetic where avoidable.

Preserve timestamps.

Handle deleted/archived records safely.

Avoid duplicate payment creation from accidental double submission.

15. UX Principles
The product should prioritize speed and clarity.

Daily flow
The user should be able to:

Open dashboard.

See today's work.

Add completed/new work quickly.

Record received payment quickly.

Record expense quickly.

Review pending money.

Continue working.

Design direction
Minimal

Professional

Clean

Symmetrical

Strong visual hierarchy

Mobile-first responsive layout

Desktop-friendly data tables

Fast forms

Clear ₹ currency presentation

Subtle purposeful animations

No unnecessary decorative UI

The design should feel like a serious personal business/work tool, not a generic banking clone.

16. Security & Privacy
Because the application contains financial information:

Authentication should be supported if the app is deployed online.

Use secure password/session handling or a trusted authentication provider.

Never store plaintext passwords.

Validate all server-side inputs.

Authorize every record access.

Protect APIs from unauthorized access.

Use HTTPS in production.

Do not expose sensitive data in client-side logs.

Do not place secrets in frontend code.

Provide data export and deletion controls.

Add backups appropriate to the chosen deployment architecture.

If multi-user support is added later, every business record must be scoped to the correct user/account.

17. Recommended Architecture
The implementation should use a clear separation between:

Frontend/UI

API/backend

Database

Authentication

Business logic

Reporting/calculation layer

The exact technology stack can be selected after inspecting the development environment and project constraints.

Do not select technology merely because it is popular. Choose based on:

reliability

maintainability

deployment cost

performance

developer productivity

data safety

future extensibility

18. Non-Goals for the Initial Version
Do not unnecessarily expand V1 into:

Full accounting/ERP

GST filing system

Payroll system

Inventory management

Banking API integration

Automatic bank transaction synchronization

Complex investment tracking

AI financial advisor

These can be considered later if they become actual requirements.

19. V1 Success Criteria
V1 is successful when the user can reliably:

Create a person.

Create work for that person.

Set agreed work amount.

Record one or multiple payments.

Mark payment as online/cash/udhar where applicable.

See remaining amount automatically.

Record expenses.

See revenue, expenses, and profit.

See today's work.

Search historical records.

Filter by date/time, amount, person, work, and payment method.

View complete history.

Edit records safely.

Export useful records.

Use the system comfortably on mobile and desktop.

20. Important Product Rule
Do not build this as simply an "expense tracker."

The central product is:

Work → Person → Money → Payment → Expense → Profit → History

Every major screen and database relationship should reinforce this workflow.

