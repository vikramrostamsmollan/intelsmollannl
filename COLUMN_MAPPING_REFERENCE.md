# Column Mapping Reference - Expected vs. Actual

## 1. Product Dimension (MSH PROD_DIM)

### IntelProductsConnection.pq Expectations vs. Reality

| Position | PQ Expects | Actual Column (Sheet 4) | Status |
|----------|-----------|----------------------|--------|
| 1 | PROD_ID MSHNLARTICLE_DEF | B2B | ❌ WRONG |
| 2 | MODEL | GRAPHICS | ❌ WRONG |
| 3 | PROCESSOR TYPE | GeForce RTX 5070 Ti | ❌ DATA, NOT HEADER |
| 4 | RAM | MODEL | ⚠️ WRONG (duplicate) |
| 5 | STORAGE | Resolutie | ❌ WRONG |
| 6 | GRAPHICS | MODEL | ❌ DUPLICATE |
| 7 | Fabrician | PROCESSOR | ⚠️ CLOSE (missing "TYPE") |
| 8 | Segment | STORAGE | ⚠️ CLOSE (data value) |

**Analysis:** Row 1 is severely corrupted with mixed headers and data. The actual header row appears to be missing or interspersed with data.

---

## 2. Stock Matrix (Intel Table 20242025 Stock)

### IntelStockFactConnection.pq Expectations vs. Reality

#### Expected Product Descriptor Columns (for unpivoting)
```
["chassis", "Scherm", "Inch", "Resolutie", "CPU", "RAM", "Storage", "Graphics"]
```

#### What Actually Exists

**Row 1 Columns:**
- Col A: `2560 x 1440` (Resolution data, not a header)
- Col B: `Bernds` (Store name data)
- Col C: `https://retailedge.intel.com/...` (URL data)
- Col D: `Scherm` ✓ (Found!)
- Col E: `Inch` ✓ (Found!)
- Col F: `Resolutie` ✓ (Found!)
- Col G: `CPU` ✓ (Found!)
- Col H: `RAM` ✓ (Found!)
- Col I: `Bakkum` (Store name data)
- Col J: `Media Markt Leeuwarden` (Store name data)
- ... (more store names in remaining columns)

**Row 2 Columns:**
- Col A: `Storage` (Expected in Row 1 headers, found in Row 2!)
- Col B: `Graphics` (Expected in Row 1 headers, found in Row 2!)
- Col C-onwards: Product data starts (Acer Nitro V 15, specifications, quantity data)

#### Issues
| Issue | Impact |
|-------|--------|
| `chassis` column completely missing | ❌ Cannot build SpecKey |
| Product headers split across Row 1 and Row 2 | ❌ Table transformation will fail |
| Store names appear in header rows | ❌ Unpivot will include wrong columns as "StoreName" |
| Product data starts in Row 2, not Row 1 | ❌ Data structure mismatch |
| Only 11 rows total data | ⚠️ Very limited dataset (10 products) |

---

## 3. Store Dimension (Store_DIM)

### StoreDimensionConnection.pq Expectations vs. Reality

| Position | PQ Expects | Actual Column (Sheet 10) | Match? | Notes |
|----------|-----------|------------------------|--------|-------|
| 1 | Name | Uffen | ❌ NO | Wrong header label (appears to be a data value) |
| 2 | Country | Country | ✓ YES | Correct |
| 3 | Retailer | Retailer | ✓ YES | Correct |
| 4 | Retailer Id | Store Visit? | ❌ NO | Wrong column entirely |
| 5 | Store Id | Start Date | ❌ NO | Wrong column entirely |
| 6 | Store Code | Store Code | ✓ YES | Present but different position |
| 7 | Location | (Missing) | ❌ MISSING | No Location column found |
| 8 | City | Retailer Id | ⚠️ PARTIAL | Column exists but wrong position |
| 9 | State | City | ❌ NO | Wrong position; "State" column missing |

#### Column Order Mismatch Summary
```
Expected: Name | Country | Retailer | Retailer Id | Store Id | Store Code | Location | City | State
Actual:   Uffen | Country | Retailer | Store Visit? | Start Date | Store Code | Retailer Id | City | Store Id
```

#### Missing/Renamed Columns
- **Missing:** Location (expected in position 7)
- **Missing:** State (expected in position 9)
- **Extra (not expected):** Store Visit?, Start Date
- **Wrongly positioned:** Retailer Id (position 4 expected, but position 7 actual)
- **Wrongly positioned:** Store Id (position 5 expected, but position 9 actual)

---

## Impact on Key Construction

### SpecKey (Product Specifications)

**Code from IntelProductsConnection.pq (Lines 37-44):**
```power query
Text.Combine(
    {
        try [#"PROCESSOR TYPE"] otherwise "",
        try [RAM] otherwise "",
        try [STORAGE] otherwise "",
        try [GRAPHICS] otherwise ""
    },
    "|"
)
```

**Status:** ❌ **WILL FAIL**
- Column "PROCESSOR TYPE" → Does not exist in actual data
- Column "RAM" → Does not exist in actual data
- Column "STORAGE" → May exist but at wrong position
- Column "GRAPHICS" → May exist but at wrong position
- Result: All SpecKey values will be empty or null

### StoreKey (Store Names)

**Code from StoreDimensionConnection.pq (Lines 50-51):**
```power query
Text.Upper(try [Name] otherwise "")
```

**Status:** ❌ **WILL FAIL**
- Column "Name" → Does not exist (first column is "Uffen")
- Result: All StoreKey values will be empty or null

---

## Quick Fix Checklist

- [ ] **Table references:** Change from named tables to sheet names
  - `Table_4` → `MSH PROD_DIM`
  - `Tabel6` → `Intel Table 20242025 Stock`
  - `Table10` → `Store_DIM`

- [ ] **Product sheet:**
  - [ ] Fix/restore proper header row
  - [ ] Ensure PROD_ID, MODEL, PROCESSOR TYPE, RAM, STORAGE, GRAPHICS columns exist
  - [ ] Check Fabrician and Segment columns

- [ ] **Stock sheet:**
  - [ ] Add missing "chassis" column
  - [ ] Consolidate product headers into single row
  - [ ] Verify CPU, RAM, Storage, Graphics align properly
  - [ ] Check store names in unpivot columns

- [ ] **Store sheet:**
  - [ ] Rename first column from "Uffen" to "Name"
  - [ ] Add missing "Location" column
  - [ ] Add missing "State" column
  - [ ] Reorder columns to match expected structure
  - [ ] Remove extra columns (Store Visit?, Start Date) or update PQ script

---

**Generated:** March 27, 2026
**Files Analyzed:**
- IntelProductsConnection.pq
- IntelStockFactConnection.pq
- StoreDimensionConnection.pq
- Intel NL Field Covered stores 2025.xlsx
