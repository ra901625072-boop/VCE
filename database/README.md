# Database Directory

This directory stores persistent application data for **VCE Work & Money Flow Tracker**.

## Source of Truth
The primary source of truth is the SQLite database file:
```
database/vce.db
```

### Critical Rules
1. **Never use JSON files as live database storage.**
2. JSON files in `seeds/` are used strictly for initial configuration and sample data.
3. Automated database backups are created in `database/backups/`.
4. Monetary values are stored as integer paise (`100 paise = ₹1.00`).
