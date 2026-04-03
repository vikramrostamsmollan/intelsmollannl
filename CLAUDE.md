# Smollan Intel NL - Power BI Project

## Project Overview

Power BI analytics solution for tracking Intel product stock across retail stores in the Netherlands. Built for Smollan field operations.

## Data Source

Single Excel workbook: `Intel NL Field Covered stores 2025.xlsx`
- **Table_4**: Product catalog (columns: PROD_ID, MODEL, PROCESSOR TYPE, RAM, STORAGE, GRAPHICS, Fabrician, Segment)
- **Tabel6**: Stock matrix — product rows x store columns (columns: chassis, Scherm, Inch, Resolutie, CPU, RAM, Storage, Graphics, then one column per store)
- **Table10**: Store dimension (columns: Name, Country, Retailer, Retailer Id, Store Id, Store Code, Location, City, State)

## Data Model (Star Schema)

Three Power Query tables with two relationships:

| Query | Script | Type | Key Columns |
|-------|--------|------|-------------|
| `DimProduct_Intel` | `IntelProductsConnection.pq` | Dimension | `SpecKey` |
| `DimStore_Intel` | `StoreDimensionConnection.pq` | Dimension | `StoreKey` |
| `FactIntelStockByStore` | `IntelStockFactConnection.pq` | Fact | `SpecKey`, `StoreKey` |

**Relationships:**
1. `DimProduct_Intel[SpecKey]` (1) → `FactIntelStockByStore[SpecKey]` (many)
2. `DimStore_Intel[StoreKey]` (1) → `FactIntelStockByStore[StoreKey]` (many)

**SpecKey** = `Text.Upper(CPU | RAM | Storage | Graphics)` — note that column names differ between product table (`PROCESSOR TYPE`) and stock table (`CPU`).

**StoreKey** = `Text.Upper(StoreName)` — derived from unpivoted column headers in fact table, and `Name` column in store dimension.

## Key Files

- `*.pq` — Power Query (M language) connection scripts
- `IntelModelRelationships.md` — Relationship setup guide and validation DAX
- `automated_email_dax_formula.md` — DAX mailto pattern reference
- `Intel 2025 BI.pbix` — Power BI Desktop report (binary, not in git)

## Coding Standards

### Power Query (M)
- Always normalize text with `Text.Trim` + `Text.Upper` before creating keys
- Use `try [Column] otherwise ""` for null safety in key construction
- Keep `DatabaseFilePath` as the first variable for easy path updates
- Comment sections with `//` explaining the transformation purpose

### DAX
- Use `VAR` for readability in complex measures
- Format numbers with `FORMAT()` for display measures
- Escape `%` as `%25` in URL-based measures (mailto)

## Known Issues

- PQ scripts use hard-coded path `H:\Mijn Drive\...` — must update if workbook moves
- SpecKey depends on data values matching across two different Excel sheets with different column names
- StoreKey depends on exact name match between unpivoted headers and store dimension
- `.gitignore` excludes `.xlsx`/`.pbix` — collaborators need data files shared separately

## Workspace

VS Code workspace: `Smollan Intel.code-workspace`
Recommended extensions: Power BI Modeling MCP, GitHub Copilot Chat

## Design System (Intel Booking)

The Intel Training Booking Platform has a formal design system. **Always read `Intel Booking/DESIGN.md` before making any visual or UI decisions for that project.**

- All font choices, colors, spacing, and aesthetic direction are defined in `Intel Booking/DESIGN.md`
- Do not deviate from the design system without explicit user approval
- Design tool: Google Stitch MCP — project ID `10082113111138965187`
- 7 screens designed: Landing → Training Selection → Date & Time → Enter Details → Review → Dashboard → Booking Confirmed
- Key choices: dark-first (#0A0A0F), Space Grotesk + DM Sans, Intel Blue #0071C5, glassmorphism nav
