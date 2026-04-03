---
paths:
  - "*.md"
  - "*.dax"
---

# DAX Rules

- Use `VAR` / `RETURN` pattern for readability
- `SELECTEDVALUE()` for single-value context in measures
- `SWITCH(TRUE(), ...)` for conditional branching
- URL-encode special characters in mailto measures: `%` → `%25`, `&` → `%26`
- Use `CHAR(13) & CHAR(10)` for newlines in email body text
- Format: `FORMAT(value, "$#,##0")` for currency, `FORMAT(value, "0.0%")` for percentages
- Validation queries use `EVALUATE SUMMARIZECOLUMNS(...)` syntax
