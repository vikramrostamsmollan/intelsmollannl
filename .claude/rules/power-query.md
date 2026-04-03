---
paths:
  - "*.pq"
---

# Power Query (M Language) Rules

- All PQ scripts connect to the same Excel workbook via `DatabaseFilePath` variable at the top
- When editing PQ scripts, preserve the `let ... in` structure
- Key columns (`SpecKey`, `StoreKey`) must use `Text.Upper()` for case-insensitive matching
- Use `Text.Trim(Text.From(_))` pattern for normalizing text columns
- Null-safe access pattern: `try [ColumnName] otherwise ""`
- `Table.Distinct` on key column ensures clean dimension tables (one row per key)
- `Table.UnpivotOtherColumns` is used to transform the stock matrix from wide to tall format
