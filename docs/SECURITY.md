# VCE Work & Money Flow Tracker — Security & Privacy Architecture

The application handles sensitive client and financial flow information. The security architecture satisfies all SEC-001 through SEC-010 requirements.

---

## 1. Data Protection & SQLite Boundary
- **Never expose direct SQLite access to clients**: The frontend HTML/CSS/JS layer has zero direct database connectivity; every operation passes through the FastAPI backend validation layer.
- **SQL Injection Prevention**: All queries use parameterized queries (`?` placeholders). No string concatenation is used for user inputs.
- **Precision Validation**: Pydantic v2 schemas strictly validate types, ranges, strings, and integer amounts before any business logic execution.

---

## 2. Password & Key Storage
- **No plaintext passwords**: Passwords are hashed using standard PBKDF2-HMAC-SHA256 with 100,000 iterations and cryptographic per-user random salt.
- **Secrets Management**: No secret keys, API tokens, or DB credentials exist in frontend code. All configuration values are loaded from server-side environment variables (`.env`).

---

## 3. Financial Integrity & Auditability
- **Non-Destructive Deletions**: Deleting a person or work record that has linked payments performs a soft-archive (`is_archived = 1`), preserving historical ledger continuity.
- **Full Activity Timeline**: Major lifecycle events (work creation, payment receipt, expense addition, status transitions) are appended to `activity_log`.
