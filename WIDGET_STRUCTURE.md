# Dashboard Widget Structure Guide

## Overview
The dashboard now uses a harmonious grid system with consistent spacing, sizing, and typography across all widgets.

## Grid System

### Desktop (lg: 1024px+)
- **6-column grid** with 5px gap
- `small` widgets: 1 column (16.67% width)
- `medium` widgets: 2 columns (33.33% width)
- `large` widgets: 3 columns (50% width)

### Tablet (sm: 640px - 1023px)
- **2-column grid** with 5px gap
- `small` widgets: 1 column (50% width)
- `medium` widgets: 2 columns (100% width)
- `large` widgets: 2 columns (100% width)

### Mobile (< 640px)
- **1-column grid** with 5px gap
- All widgets: full width

## Widget Sizing

### Height Guidelines (h-auto, min-height)
- **small**: `min-h-[160px]` - For compact cards (e.g., single metric)
- **medium**: `min-h-[280px]` - For balanced content (e.g., 2-4 metrics)
- **large**: `min-h-[360px]` - For comprehensive content (e.g., full-width displays)

Heights grow with content - `h-auto` prevents squeezing text.

### Padding (inside widget)
- **small**: `p-4` (16px) - Tight spacing for compact widgets
- **medium**: `p-5` (20px) - Standard spacing
- **large**: `p-6` (24px) - Generous spacing for large widgets

## Creating a Widget

### Using the WidgetContainer Pattern (Recommended)

```tsx
import { motion } from "framer-motion";
import { WidgetSize, getColSpan } from "@/lib/dashboardWidgets";
import {
  WidgetContainer,
  WidgetTitle,
  WidgetContent,
  WidgetEmptyState,
} from "./WidgetContainer";
import { useMemo } from "react";
import { loadTradesFromLocalStorage } from "@/lib/tradeLoaders";

interface MyWidgetProps {
  size: WidgetSize;
}

export function MyWidget({ size }: MyWidgetProps) {
  const storedTrades = loadTradesFromLocalStorage();

  // Calculate data...
  const hasData = storedTrades.length > 0;

  if (size === "small") {
    return (
      <motion.div
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0 },
        }}
        className={getColSpan(size)}
      >
        {/* Small layout - simplified view */}
      </motion.div>
    );
  }

  // Large/Medium
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={getColSpan(size)}
    >
      {!hasData ? (
        <WidgetContainer size={size}>
          <WidgetEmptyState
            icon="📊"
            title="Widget Title"
            description="No data available"
            dataNeeded="Specify required data"
          />
        </WidgetContainer>
      ) : (
        <WidgetContainer size={size}>
          <WidgetTitle size={size}>📊 Widget Title</WidgetTitle>
          <WidgetContent size={size}>
            {/* Your widget content */}
          </WidgetContent>
        </WidgetContainer>
      )}
    </motion.div>
  );
}
```

## Key Components

### WidgetContainer
Provides consistent styling:
- Rounded corners: `rounded-2xl`
- Background: `bg-card`
- Shadow: `shadow-card`
- Border: `border border-border/50`
- Padding: Responsive (`p-4` | `p-5` | `p-6`)
- Flexbox column layout with full height

### WidgetTitle
- Standardized font sizes (sm/base/lg)
- Proper margin bottom (`mb-4`)
- Foreground color

### WidgetContent
- Flexible grow space
- Responsive spacing between children:
  - small: `space-y-2`
  - medium: `space-y-3`
  - large: `space-y-4`

### WidgetEmptyState
Shows when no data is available:
- Large icon (4xl)
- Clear title
- Description
- Optional "Data needed" message

## Spacing Rules

### Between Widgets
- Gap: `gap-5` (20px)

### Inside Widgets
- Title to content: `mb-4` (16px)
- Between content items:
  - small: `space-y-2` (8px)
  - medium: `space-y-3` (12px)
  - large: `space-y-4` (16px)

### Between Grid Items
- Horizontal: 5px (from grid gap)
- Vertical: 5px (from grid gap)

## Typography

Consistent sizing based on widget size:

### Widget Title
- small: `text-sm` (14px)
- medium: `text-base` (16px)
- large: `text-lg` (18px)

### Labels (inside content)
- Use: `text-sm text-muted-foreground`

### Values
- Size depends on context (not enforced globally)
- Use semantic colors (e.g., `text-green-500` for positive)

## Colors

### Always Use
- **Text**: `text-foreground` (main), `text-muted-foreground` (secondary)
- **Background**: `bg-card`, `bg-muted/30`
- **Borders**: `border-border`, `border-border/50`
- **Accents**: `text-primary`, `text-green-500`, `text-red-500`

### Avoid
- Hard-coded colors (e.g., `#ffffff`)
- Inconsistent color usage (use design tokens)

## Export Pattern

Make sure to export your widget in `src/components/widgets/index.ts`:

```tsx
export { MyWidget } from './MyWidget';
```

And register it in `dashboardWidgets.ts`:

```typescript
export const WIDGET_REGISTRY: Record<WidgetId, ...> = {
  'my-widget': {
    id: 'my-widget',
    title: 'My Widget',
    description: 'Widget description',
    icon: '📊',
    enabled: true,
    size: 'medium',
    minSize: 'small',
    maxSize: 'large',
    category: 'performance',
  },
  // ...
};
```

## Responsive Behavior

Widgets should:
1. Use `h-auto min-h-[Xpx]` (not fixed heights)
2. Use `getColSpan(size)` for grid placement
3. Adapt content layout based on available space
4. Show condensed view on small screens
5. Show full view on large screens

## Common Patterns

### Empty State with Multiple Sizes
```tsx
if (!hasData) {
  return (
    <motion.div variants={{...}} className={getColSpan(size)}>
      <WidgetContainer size={size}>
        <WidgetEmptyState icon="..." title="..." description="..." />
      </WidgetContainer>
    </motion.div>
  );
}
```

### Size-Based Layouts
```tsx
if (size === 'small') {
  return <div>Simplified view</div>;
}

return (
  <WidgetContainer size={size}>
    <WidgetTitle size={size}>Title</WidgetTitle>
    <WidgetContent size={size}>Full content</WidgetContent>
  </WidgetContainer>
);
```

## Testing Responsive Behavior

1. **Mobile (375px)**: Single column, full width
2. **Tablet (640px)**: Two columns
3. **Desktop (1024px)**: Six columns
4. **Large Desktop (1280px)**: Six columns, more spacing

Test with browser DevTools:
- Chrome: F12 → Toggle Device Toolbar (Ctrl+Shift+M)
- Firefox: F12 → Responsive Design Mode (Ctrl+Shift+M)
