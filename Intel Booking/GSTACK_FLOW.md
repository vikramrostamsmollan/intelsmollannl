# GStack Flow — Smollan Intel NL Power BI Project

> Reference guide for using gstack skills in this project's workflow.
> Project: Power BI analytics for Intel product stock tracking across Dutch retail stores.

---

## When to Use Which Skill

| Situation | Skill | Command |
|-----------|-------|---------|
| Starting a new feature or query redesign | Office Hours | `/office-hours` |
| Planning a complex PQ or DAX change | Plan → Eng Review | `/plan-eng-review` |
| CEO-level scope review (is this the right thing?) | CEO Review | `/plan-ceo-review` |
| Reviewing a diff before committing | PR Review | `/review` |
| Debugging a broken relationship or key mismatch | Investigate | `/investigate` |
| Shipping a change (commit → push → PR) | Ship | `/ship` |
| Weekly check-in on project health | Retro | `/retro` |
| Updating docs after a change ships | Document Release | `/document-release` |

---

## Standard Development Flow

```
1. IDEATE      /office-hours       ← What are we building & why?
       ↓
2. PLAN        /plan-eng-review    ← Architecture, edge cases, PQ/DAX approach
       ↓
3. REVIEW      /review             ← Pre-commit diff check
       ↓
4. SHIP        /ship               ← Commit, push, PR
       ↓
5. DOCUMENT    /document-release   ← Update CLAUDE.md, docs, CHANGELOG
```

---

## Project-Specific Flows

### A. New Power Query Script

```
/office-hours (builder mode)
  → Clarify transformation goal
  → Agree on SpecKey / StoreKey approach

/plan-eng-review
  → Lock in column mappings
  → Verify Text.Trim + Text.Upper normalization
  → Edge cases: nulls, mismatched names

Edit *.pq file
  → Update DatabaseFilePath if needed
  → Test in Power BI Desktop

/review → /ship
```

### B. New DAX Measure

```
/plan-eng-review
  → VAR/RETURN structure
  → SWITCH(TRUE()) vs IF nesting
  → FORMAT() for display measures

Write DAX in Power BI Desktop
  → Test against DimProduct_Intel, DimStore_Intel, FactIntelStockByStore

/document-release (if measure is significant)
```

### C. Debugging Key Mismatches (SpecKey / StoreKey)

```
/investigate
  → Identify which key is mismatching
  → Check Text.Upper consistency across both tables
  → Verify column name differences (PROCESSOR TYPE vs CPU)

Edit IntelStockFactConnection.pq or IntelProductsConnection.pq
  → Fix normalization

/review → /ship
```

### D. Weekly Project Health Check

```
/retro
  → Commit history analysis
  → What shipped, what's pending
  → Known issues status
```

---

## MCP Tools Available in This Session

| MCP | Use For |
|-----|---------|
| `stitch` | Generate UI mockups / screen designs |
| `claude.ai Gmail` | Draft emails (e.g. store coverage reports) |
| `claude.ai Google Calendar` | Schedule field visits or review meetings |
| `claude.ai Microsoft Learn` | Power BI / DAX / Power Query docs |
| `claude.ai Indeed` | (Not relevant to this project) |
| `claude.ai Crypto.com` | (Not relevant to this project) |

**Stitch** is most relevant here if you ever want to mockup a Power BI dashboard layout
or field app screen before building it in Power BI Desktop.

---

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| [IntelProductsConnection.pq](IntelProductsConnection.pq) | DimProduct_Intel Power Query |
| [IntelStockFactConnection.pq](IntelStockFactConnection.pq) | FactIntelStockByStore Power Query |
| [StoreDimensionConnection.pq](StoreDimensionConnection.pq) | DimStore_Intel Power Query |
| [IntelModelRelationships.md](../IntelModelRelationships.md) | Relationship setup + validation DAX |
| [automated_email_dax_formula.md](../automated_email_dax_formula.md) | mailto DAX pattern |
| [CLAUDE.md](../CLAUDE.md) | Project conventions & data model |

---

## GStack Setup Notes

- **Install:** `~/.claude/skills/gstack` (global-git install)
- **Version:** v0.14.3.0 (upgraded 2026-03-31)
- **bun required for setup:** `powershell -c "irm bun.sh/install.ps1 | iex"`
- **After installing bun:** `cd ~/.claude/skills/gstack && ./setup`

---

## Coding Conventions (from CLAUDE.md)

### Power Query
- Always `Text.Trim` + `Text.Upper` on key columns
- Use `try [Column] otherwise ""` for null safety
- `DatabaseFilePath` as first variable in every script

### DAX
- `VAR`/`RETURN` pattern for complex measures
- `FORMAT()` for display
- Escape `%` as `%25` in mailto measures
