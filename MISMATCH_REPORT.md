# Power Query to Excel Workbook Mismatch Report

**Date:** March 27, 2026
**Status:** CRITICAL - All three PQ scripts will fail due to non-existent table references

---

## Executive Summary

The Power Query scripts in this project reference table names that **do not exist** in the actual Excel workbook. Additionally, even if the correct sheet names are used, the column structures have significant mismatches. This prevents the Power BI data model from loading any data.

---

## Critical Issue #1: Non-existent Table Names

### Problem
All three Power Query scripts reference tables by name that do not exist in the workbook.

| Script | Referenced Table | Exists? | Actual Sheet Name |
|--------|------------------|---------|-------------------|
| `IntelProductsConnection.pq` (L6) | `Table_4` | ❌ NO | `MSH PROD_DIM` |
| `IntelStockFactConnection.pq` (L6) | `Tabel6` | ❌ NO | `Intel Table 20242025 Stock` |
| `StoreDimensionConnection.pq` (L6) | `Table10` | ❌ NO | `Store_DIM` |

### Why This Happens
Excel files can define **named tables** (via Table menu or Data > Define Table), which are different from sheet names. The PQ scripts are looking for these named tables, but they were never created. The workbook only has regular sheets.

### Current Code (All 3 Scripts Fail Here)
```power query
Source = Excel.Workbook(File.Contents(DatabaseFilePath), null, true),
ProductTable = Source{[Item = "Table_4", Kind = "Table"]}[Data],  // <- FAILS: Table_4 doesn't exist
```

---

## Critical Issue #2: Product Dimension Column Mismatch

### Sheet: `MSH PROD_DIM` (Sheet 4)

**Dimensions:** A1:L116 (116 rows × 12 columns)

#### What PQ Script Expects
From `IntelProductsConnection.pq` lines 13-20:
```
- PROD_ID MSHNLARTICLE_DEF
- MODEL
- PROCESSOR TYPE
- RAM
- STORAGE
- GRAPHICS
- Fabrician
- Segment
```

#### What Actually Exists (Row 1)
```
Column A: B2B
Column B: GRAPHICS
Column C: GeForce RTX 5070 Ti
Column D: MODEL
Column E: Resolutie
Column F: MODEL
Column G: PROCESSOR
Column H: STORAGE
Column I: AMD Ryzen 5 8540U
Column J: Fabrician
Column K: Total Trainings
Column L: ACTIVE RSPs (Last Login 2026)
```

#### Issues
1. **Headers mixed with data:** Row 1 contains both header names (GRAPHICS, MODEL, PROCESSOR, STORAGE) and actual data values (GeForce RTX 5070 Ti, AMD Ryzen 5 8540U)
2. **Wrong column order:** Expected columns don't match actual layout
3. **Missing columns:** No clear `PROD_ID`, no `RAM`, no `Segment` column
4. **Wrong column names:** "PROCESSOR" instead of "PROCESSOR TYPE", "STORAGE" appears twice
5. **Extra columns:** "Total Trainings", "ACTIVE RSPs" are not expected

#### Impact
The SpecKey construction (PROCESSOR TYPE + RAM + STORAGE + GRAPHICS) will fail because:
- PROCESSOR TYPE column doesn't exist
- RAM column doesn't exist
- Column names don't match what the script expects

---

## Critical Issue #3: Stock Matrix Structure Mismatch

### Sheet: `Intel Table 20242025 Stock` (Sheet 8)

**Dimensions:** A1:W11 (11 rows × 23 columns)

#### What PQ Script Expects
From `IntelStockFactConnection.pq` line 10:
```
ProductColumns = {"chassis", "Scherm", "Inch", "Resolutie", "CPU", "RAM", "Storage", "Graphics"}
```

The script expects these 8 product descriptor columns, then unpivots all remaining columns as store names.

#### What Actually Exists

**Row 1:** `2560 x 1440 | Bernds | https://retailedge.intel.com/...| Scherm | Inch | Resolutie | CPU | RAM | Bakkum | Media Markt Leeuwarden | ...`

**Row 2:** `Storage | Graphics | 15 | Acer Nitro V 15... | 15.6" FHD IPS 144Hz | 1920 x 1080 | Intel Core i7... | 16GB | 1 | 1 | 0 | 0 | ...`

#### Issues
1. **Headers span multiple rows:** Product descriptor names (Scherm, Inch, Resolutie, CPU, RAM, Storage, Graphics) are spread across Row 1 and Row 2
2. **Missing "chassis" column:** Expected as first column, not found
3. **Data starting in Row 2:** Actual product data (Acer Nitro V 15, 16GB RAM) starts in Row 2, not after the headers
4. **Store names interspersed:** Columns like "Bakkum" and "Media Markt Leeuwarden" appear among header rows, not in a clean section
5. **Only 11 rows total:** Very limited data (only 10 products)

#### Impact
The unpivot transformation will fail or produce incorrect results:
```power query
Unpivoted = Table.UnpivotOtherColumns(TrimmedColumnNames, ProductColumns, "StoreName", "StockValue)
// <- Will fail because ProductColumns don't exist as proper headers in correct positions
```

The SpecKey construction will fail because CPU column doesn't have proper data alignment.

---

## Critical Issue #4: Store Dimension Column Mismatch

### Sheet: `Store_DIM` (Sheet 10)

**Dimensions:** A1:I56 (56 rows × 9 columns)

#### What PQ Script Expects
From `StoreDimensionConnection.pq` lines 12-20:
```
- Name
- Country
- Retailer
- Retailer Id
- Store Id
- Store Code
- Location
- City
- State
```

#### What Actually Exists (Row 1)
```
Column A: Uffen                (Expected: Name)
Column B: Country              (✓ Match)
Column C: Retailer             (✓ Match)
Column D: Store Visit?         (Expected: Retailer Id - MISMATCH)
Column E: Start Date           (Expected: Store Id - MISMATCH)
Column F: Store Code           (✓ Match, but different position)
Column G: Retailer Id          (✓ Match, but wrong position)
Column H: City                 (✓ Match)
Column I: Store Id             (✓ Match, but wrong position)
```

#### Issues
1. **Wrong first column:** "Uffen" instead of "Name" (possibly a header label, but wrong)
2. **Missing "Location" column:** Not present in the sheet
3. **Wrong column order:** Retailer Id, Store Id, Store Code are in different positions than expected
4. **Extra columns:** "Store Visit?" and "Start Date" are not expected
5. **Missing "State" column:** Expected but not present

#### Impact
The PQ script will fail when trying to transform these columns:
```power query
{"Name", "Country", "Retailer", "Retailer Id", "Store Id", "Store Code", "Location", "City", "State"}
// <- Columns "Name" and "Location" and "State" don't exist
// <- Column order is completely different
```

The StoreKey construction will fail because there's no "Name" column.

---

## Summary of File Paths

- **Product PQ Script:** `/h/Mijn Drive/Vikram HB Intel Notebook LLM Data Source/IntelProductsConnection.pq`
- **Stock PQ Script:** `/h/Mijn Drive/Vikram HB Intel Notebook LLM Data Source/IntelStockFactConnection.pq`
- **Store PQ Script:** `/h/Mijn Drive/Vikram HB Intel Notebook LLM Data Source/StoreDimensionConnection.pq`
- **Excel Workbook:** `/h/Mijn Drive/Vikram HB Intel Notebook LLM Data Source/Intel NL Field Covered stores 2025.xlsx`
- **Power BI File:** `/h/Mijn Drive/Vikram HB Intel Notebook LLM Data Source/Intel 2025 BI.pbix`

---

## Recommended Actions

To fix these mismatches:

1. **Short-term (Quick fix):**
   - Update table name references: `Table_4` → `MSH PROD_DIM`, `Tabel6` → `Intel Table 20242025 Stock`, `Table10` → `Store_DIM`
   - Use sheet names instead of table names: Change `[Item = "Table_4", Kind = "Table"]` to `[Item = "MSH PROD_DIM", Kind = "Sheet"]`

2. **Medium-term (Proper fix):**
   - Restructure the Excel sheets to match PQ expectations:
     - Product sheet: Add proper headers row, ensure PROD_ID, PROCESSOR TYPE, RAM columns exist
     - Stock sheet: Consolidate headers into a single row, ensure chassis column exists
     - Store sheet: Rename/reorder columns to match (Name, Country, Retailer, Retailer Id, Store Id, Store Code, Location, City, State)

3. **Long-term (Data quality):**
   - Create actual named tables in Excel (not just sheet names) for better clarity
   - Validate data structure against the documented star schema in CLAUDE.md
   - Add data validation rules to prevent future corruption

---

## Detailed Workbook Sheet List

| # | Sheet Name | Status | Purpose |
|----|------------|--------|---------|
| 1 | MSH NL Store Mailer Data | Active | Unknown |
| 2 | REM covered stores NL | Active | Unknown |
| 3 | Report REM TOOL Training | Active | Unknown |
| 4 | MSH PROD_DIM | Active | **Product Dimension (BROKEN)** |
| 5 | MSH Xplace Analytics Q1 2026 | Active | Unknown |
| 6 | IRE covered Stores | Active | Unknown |
| 7 | Mailing | Active | Unknown |
| 8 | Intel Table 20242025 Stock | Active | **Stock Fact Table (BROKEN)** |
| 9 | StoreCount | Active | Unknown |
| 10 | Store_DIM | Active | **Store Dimension (BROKEN)** |
| 11 | Adam Centrum Notes | Active | Unknown |
| 12 | IRE Targets | Hidden | Unknown |
| 13 | POS KPI &reporting | Hidden | Unknown |
| 14 | Date_DIM | Active | Possible dimension |
| 15 | _Xplace_Helper | Hidden | Helper data |
| 16 | PC_Audit_Data | Hidden | Audit log |

---

**End of Report**
