# Stitch Fire Safety Management — Visual Identity & Blue Design Blueprint

This document specifies the visual guidelines, typography, layout rules, and component system for replicating the Stitch Fire Safety Management user interface in a refined **Safety Cobalt & Deep Azure Blue** theme. Follow these core design values and Tailwind patterns to achieve a highly polished, responsive, and tactile web experience.

---

## 🌎 1. Visual Mood & Color Palette Archeype

The aesthetic is styled as an **Executive Operations Console**—combining clean, high-contrast off-whites with sharp, professional deep-blue structural accents. This instills authority, clarity, and safety reliability.

### Core Canvas & Neutrals
*   **Application Workspace Background:** `bg-slate-50` (soft, cool, eye-safe gray)
*   **Component Base Cards:** `bg-white` (pure fluid surfaces with subtle border limits)
*   **Border Enclosures:** `border-slate-200` (default dividing line structure; use `border-slate-100` for internal nested panels)
*   **Muted Text Details:** `text-slate-400` / `text-slate-500` (for captions, metadata, and timestamps)
*   **Deep Contrast Typography:** `text-slate-900` (for display headings, totals, and primary titles)

### Primary Branding Palette: "Safety Blue & Azure"
Replace the previous teal/purple defaults with a dedicated, high-contrast blue hierarchy:

*   **Primary Active Action Color:** `bg-blue-600` / `text-blue-650`
    *   *Hover Condition:* `hover:bg-blue-700`
    *   *Focus/Ring Outline:* `focus:ring-blue-500/20`
*   **Secondary Action Indicator:** `bg-slate-100` with `text-slate-705` and `border-slate-300`
    *   *Hover Condition:* `hover:bg-slate-200`
*   **Compliance Accent Glow:** Use small highlight tabs on cards to guide focus:
    ```html
    <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-600"></div>
    ```

### Compliance Status Signaling Enclosures
Status indicators must use high-opacity contrast pairs to ensure readability:

| Status State | Background Class | Text Color Class | Border Class | Accompanying Icon (from Lucide) |
| :--- | :--- | :--- | :--- | :--- |
| **Fully Compliant / Active** | `bg-emerald-50/70` | `text-emerald-700` | `border-emerald-200` | `ShieldCheck` (Emerald) |
| **Expiring Soon (30 to 7d)** | `bg-amber-50/70` | `text-amber-700` | `border-amber-200` | `AlertTriangle` (Amber) |
| **Expired / Defect Hazard** | `bg-rose-50/70` | `text-rose-700` | `border-rose-200` | `ShieldX` / `ShieldAlert` (Rose) |
| **Notification Dispatched** | `bg-blue-50/70` | `text-blue-700` | `border-blue-200` | `Bell` (Blue) |

---

## 🔤 2. Font Selection & Typography Pairing

Pair display headings with structured monospace indicators to emphasize both visual craftsmanship and data precision.

1.  **Display Headings:** Use **Space Grotesk** or **Outfit** for titles to convey a tech-forward feel.
    *   `font-display font-bold tracking-tight text-slate-900`
2.  **General UI / Copy:** Use **Inter** for readable body sections.
    *   `font-sans text-xs sm:text-sm font-medium text-slate-600 leading-relaxed`
3.  **Data Indicators & Numbers:** Use **JetBrains Mono** or **Fira Code** for serial quantities, asset IDs, reference numbers, and timestamps.
    *   `font-mono text-[11px] sm:text-xs font-bold text-slate-800`

---

## 📐 3. Grid Structure & Layout Architecture

The application layout should remain clean, flat, and structured as a single-page cohesive main container with generous breathing room.

### Outer Framework Wrapper
To prevent components from stretching indefinitely on ultra-wide screens, always constrain the width:
```tsx
<div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
  <main className="flex-grow max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
    {/* Page Content Viewports go here */}
  </main>
</div>
```

### Metrics Dashboard Grid
Structure statistic dashboard cards in a fluid grid that collapses on mobile viewports:
*   **Grid Config:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4`
*   **Card Base Style:** `bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-slate-350 hover:shadow-md transition-all flex flex-col justify-between h-32`

---

## 📑 4. Reusable Blueprint Components (Tailwind CSS)

### 1. Stats Card (Azure Metric accent)
```tsx
<div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between h-32 relative overflow-hidden">
  <div className="flex justify-between items-start">
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Secure</p>
      <h3 className="text-2xl font-extrabold text-blue-600 mt-1 font-display">1,452</h3>
    </div>
    <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
      <ShieldCheck className="w-4 h-4" />
    </div>
  </div>
  <span className="text-[9px] text-blue-600 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded-md self-start">
    Fully Compliant
  </span>
</div>
```

### 2. Actionable Tab Switcher
Use clean sliding under-borders rather than block buttons:
```tsx
<div className="border-b border-slate-200">
  <nav className="flex space-x-6 -mb-px">
    <button className="pb-4 text-xs font-extrabold uppercase tracking-wide border-b-2 border-blue-600 text-blue-600">
      Overview Log
    </button>
    <button className="pb-4 text-xs font-extrabold uppercase tracking-wide border-b-2 border-transparent text-slate-400 hover:text-slate-700">
      Notifications Ledger
    </button>
  </nav>
</div>
```

### 3. Safety Compliance Table
```tsx
<div className="overflow-x-auto w-full border border-slate-200 rounded-2xl bg-white shadow-sm">
  <table className="w-full min-w-[700px] text-left border-collapse text-xs font-semibold">
    <thead>
      <tr className="border-b border-slate-200 bg-slate-50/50 text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">
        <th className="py-3 px-4">Asset ID</th>
        <th className="py-3 px-4">Quantity Units</th>
        <th className="py-3 px-4 text-center">Compliance Status</th>
        <th className="py-3 px-4 text-right">Actions</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100 text-slate-700">
      <tr className="hover:bg-slate-50/20 transition-colors">
        <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900">EXT-4105</td>
        <td className="py-3.5 px-4 text-slate-500 font-bold font-mono">15 Units</td>
        <td className="py-3.5 px-4 text-center">
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border border-emerald-100">
            <ShieldCheck className="w-3.5 h-3.5" /> Compliant
          </span>
        </td>
        <td className="py-3.5 px-4 text-right">
          <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-150 rounded-xl font-bold cursor-pointer transition-all">
            Recertify
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## 💫 5. Tactile Micro-Interactions & Usability

1.  **Touch Target Sizing:** Ensure every clickable element, toggle switch, or action anchor is styled with a touch-active pad of at least `min-h-[44px]` or wrapped in a spacious padded card.
2.  **Smooth Cursor Hover States:** Always include speed-calibrated transitions for links, switches, and buttons:
    *   `transition-all duration-200 ease-in-out`
3.  **Loading Suspense States:** When performing asynchronous scans or updates, replace buttons or elements immediately with animated loaders (`Loader2 className="animate-spin text-blue-500"`) to reassure users that process execution is underway.
