# Stitch Workflow — Intel Booking Project

> How to use Google Stitch MCP tools within the GStack skill flow.
> Project: `projects/10082113111138965187` — Intel Booking (Desktop, Trusted Innovation theme)

---

## Quick Reference — Stitch MCP Tools

| Tool | What It Does | When to Use |
|------|-------------|-------------|
| `list_projects` | List all Stitch projects | Orientation / connect |
| `list_screens` | List all screens in a project | Before editing |
| `get_screen` | Get HTML + screenshot of a screen | Review current state |
| `get_project` | Get project metadata + design system | Check theme/colors |
| `generate_screen_from_text` | Create a new screen from a text prompt | New screens |
| `edit_screens` | Edit existing screen(s) with instructions | Update screens |
| `generate_variants` | Generate design variants of a screen | Explore options |
| `list_design_systems` | List design systems | Check available themes |
| `create_design_system` | Create a new design system | New brand |
| `update_design_system` | Modify existing design system | Adjust colors/fonts |
| `apply_design_system` | Apply a design system to a project | Re-theme |
| `create_project` | Create a new Stitch project | New app/section |

---

## Current Project State

**Project ID:** `10082113111138965187`
**Theme:** Intel Dark — Sellyo Style — Intel Blue #0071C5 + Intel Amber #F0A500, Space Grotesk + DM Sans, dark-first (#0A0A0F), desktop
**Last updated:** 2026-03-31 (full Sellyo dark redesign + Intel Amber section labels)

### Active Screens (7 — current booking flow)

| Screen | Flow Step | Current ID |
|--------|-----------|-----------|
| Event Landing Page | Landing | `5fca45142d934a4b8a46a8be7fa75591` |
| Training Selection | Stap 1 | `65f8ebfe49244e6399fe25cebec96cfd` |
| Select Date & Time | Stap 2 | `7bca068477fc42e8b2e62fe276cd3ed4` |
| Enter Details | Stap 3 | `8e4c76b568084a1193e0fc0a2985860e` |
| Bevestiging / Review | Stap 4 | `903e6bccffee48bbba04cddc4a9b7435` |
| Booking Confirmed + Agenda Sync | Stap 5 | `38c81a1959f54f2087ef85aaef9f25d2` |
| Event Dashboard | Admin | `a8eab20ea60c4ab383ebf15dd1d66864` |

### Design System

| Name | ID | Used on |
|------|-----|---------|
| Intel Sellyo Dark | `assets/07e29e9142424efc98b2e2d66d4e2915` v1 | Landing Page |
| Intel Dark — Sellyo Style | `assets/72dac3c845ef45cd93a3d59f281a9009` v2 | All other screens |

**Key design tokens (see `DESIGN.md` for full spec):**
- Primary: Intel Blue `#0071C5` — CTAs, interactive elements, active steps
- Section labels: Intel Amber `#F0A500` — `TRAINING`, `DATUM`, `LOCATIE`, category headers
- Background: `#0A0A0F`, Surface: `rgba(15,23,42,0.84)`, Ghost border: `rgba(255,255,255,0.07)`
- Fonts: Space Grotesk (headings) + DM Sans (body) + DM Mono (code/refs)

---

## Standard Stitch Workflow

```
1. CONNECT     list_projects           ← Verify connection + find project ID
       ↓
2. ORIENT      list_screens            ← See what screens exist
       ↓
3. REVIEW      get_screen              ← See current HTML + screenshot
       ↓
4. EDIT/CREATE edit_screens            ← Update existing screen
               generate_screen_from_text  ← OR create new screen
       ↓
5. VARIANTS    generate_variants       ← Optional: explore design options
```

---

## Prompt Patterns That Work Well

### Editing an existing screen
```
Edit the [Screen Name] screen to:
- [specific change 1]
- [specific change 2]
Keep Intel Blue (#0071C5) for all CTAs and interactive elements.
Use Intel Amber (#F0A500) for section header labels only.
Dark background (#0A0A0F), Space Grotesk headings, DM Sans body.
```

### Creating a new screen
```
Create a [screen type] screen for Intel training bookings.
Include: [key elements]
Style: Intel Dark — Sellyo Style design system.
- Background: #0A0A0F, cards: rgba(15,23,42,0.84) with ghost border rgba(255,255,255,0.07)
- Primary CTA: Intel Blue #0071C5
- Section label accents: Intel Amber #F0A500 (never on CTAs)
- Fonts: Space Grotesk (headings), DM Sans (body)
- Glassmorphism nav: backdrop-filter: blur(20px)
- Dot grid overlay on hero sections
```

### Generating variants
```
Generate 3 variants of the [Screen Name] screen with different:
- Layout approaches (hero vs. split vs. minimal)
Keep Intel branding consistent across all variants.
```

---

## Design System Constraints (Intel Dark — Sellyo Style)

Follow these rules when writing Stitch prompts to stay on-brand. Full spec in `DESIGN.md`.

| Rule | Detail |
|------|--------|
| Primary action color | Intel Blue `#0071C5` — buttons, active states, progress steps |
| Section label accent | Intel Amber `#F0A500` — section headers like `TRAINING`, `DATUM`, `LOCATIE` |
| Background | `#0A0A0F` — never pure black, never white |
| Cards | `rgba(15,23,42,0.84)` + `border: 1px solid rgba(255,255,255,0.07)` |
| No drop shadows | Use tonal background shifts for depth |
| Border radius | 22px on main cards, 12px on buttons/inputs, 9999px on pills |
| Fonts | Space Grotesk (headings, labels, numbers) + DM Sans (body) + DM Mono (refs) |
| Nav | Glassmorphism: `backdrop-filter: blur(20px)`, `rgba(10,10,15,0.85)` |
| Hero decoration | Dot grid `radial-gradient` + radial gradient blobs (blue + purple) |
| Text hierarchy | Primary `#F8F8FF`, Secondary `#94A3B8`, Tertiary `#64748B` |

---

## Integration with GStack Skills

### Before using Stitch
Run `/office-hours` (builder mode) to clarify what screen you're building and why.

### After generating a screen
Run `/review` to check if the HTML output has any issues before using it.

### Shipping Stitch-generated assets
1. Export HTML from `get_screen`
2. Save to project if needed
3. Run `/ship` to commit and push

---

## Example: Update a Screen End-to-End

```
1. list_screens          → find screen ID
2. get_screen            → review current state
3. edit_screens          → apply changes
4. get_screen            → verify result
5. (optional) generate_variants → explore alternatives
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Stitch not in `claude mcp list` | Check `~/.claude.json` → `mcpServers.stitch` |
| API key error | Regenerate key at stitch.withgoogle.com, update `~/.claude.json` |
| Screen looks wrong | Use `get_screen` to verify, then `edit_screens` with specific instructions |
| Design drifts from Intel brand | Remind Stitch: "Use Trusted Innovation design system: Intel Blue #0071C5, Inter font, no card borders" |

---

## Files

- [GSTACK_FLOW.md](GSTACK_FLOW.md) — Full GStack skill workflow for this project
- Stitch project: `stitch.withgoogle.com` → Intel Booking
