# Dashboard Redesign – Learnings from Glassmorphism Sidebar

Design patterns adopted from the reference glassmorphism-sidebar component and how they were integrated into Shyftcut's app shell and dashboard.

---

## Learnings from the Reference

### 1. **Glass-Effect Sidebar**
- Backdrop blur, semi-transparent background, subtle border
- Creates depth and modern aesthetic

### 2. **Content Cards**
- Rounded corners (rounded-2xl), border, semi-transparent bg, backdrop-blur
- Hover: subtle border emphasis and soft shadow

### 3. **Decorative Background Shapes**
- Blurred radial gradients for depth
- `.shape-1`, `.shape-2` – positioned in corners of main content area

### 4. **Page Structure**
- Title + description + content grid
- Stat blocks with large numbers and labels
- Consistent card styling across sections

---

## Implementation in Shyftcut

### CSS Additions (`src/index.css`)
| Class | Purpose |
|-------|---------|
| `.glass-effect` | Sidebar glass styling (backdrop-blur, semi-transparent bg) |
| `.content-card` | Standalone stat/metric cards with padding |
| `.dashboard-card` | Card wrapper for shadcn Card (no extra padding, hover effect) |
| `.dashboard-shape-1` | Top-right decorative blur |
| `.dashboard-shape-2` | Bottom-left decorative blur |

### Sidebar (`src/components/ui/sidebar.tsx`)
- When `variant="sidebar"`: applies `glass-effect`, border, backdrop-blur
- RTL-aware borders: `group-data-[side=left]:border-r`, `group-data-[side=right]:border-l`

### AppShell (`src/components/layout/AppShell.tsx`)
- Added `dashboard-shape-1` and `dashboard-shape-2` divs in the main content area for subtle background depth

### Dashboard (`src/pages/Dashboard.tsx`)
- All Card components updated from `rounded-2xl border-border/50 bg-card/80 backdrop-blur` to `dashboard-card`
- Preserves existing layout, animations, and functionality

---

## Usage

To apply the dashboard card style to other app pages:

```tsx
<Card className="dashboard-card">
  <CardContent>...</CardContent>
</Card>
```

For standalone stat blocks (no Card wrapper):

```tsx
<div className="content-card">
  <h2 className="text-lg font-semibold">Label</h2>
  <p className="text-4xl font-bold text-primary">42</p>
</div>
```
