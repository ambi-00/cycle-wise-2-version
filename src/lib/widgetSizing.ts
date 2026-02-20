/**
 * Apple-inspired Widget Sizing System
 * Defines consistent heights, spacing, and layout constraints for all widgets
 */

export const WIDGET_SIZES = {
  // Row height for grid layout
  ROW_HEIGHT: 120, // pixels per row unit
  
  // Widget height mapping (in row units)
  HEIGHT_MAP: {
    small: 2,    // 240px
    medium: 3,   // 360px
    large: 5,    // 600px
  } as const,
  
  // Widget grid span
  GRID_COLS: {
    small: 1,
    medium: 2,
    large: 3,
  } as const,

  // Padding and spacing (consistent across all widgets)
  PADDING: {
    small: 12,
    medium: 16,
    large: 20,
  } as const,

  // Gap between elements
  GAP: {
    small: 6,
    medium: 8,
    large: 12,
  } as const,

  // Font sizes (responsive to widget size)
  FONT: {
    small: {
      title: 12,
      label: 10,
      value: 20,
      unit: 10,
    },
    medium: {
      title: 13,
      label: 11,
      value: 32,
      unit: 12,
    },
    large: {
      title: 14,
      label: 12,
      value: 40,
      unit: 14,
    },
  } as const,

  // Icon sizes
  ICON: {
    small: 16,
    medium: 20,
    large: 24,
  } as const,

  // Line heights for better readability
  LINE_HEIGHT: {
    small: 1.2,
    medium: 1.3,
    large: 1.4,
  } as const,
} as const;

/**
 * Calculate CSS height for a widget based on size
 */
export function getWidgetHeight(size: 'small' | 'medium' | 'large'): number {
  return WIDGET_SIZES.ROW_HEIGHT * WIDGET_SIZES.HEIGHT_MAP[size];
}

/**
 * Get padding based on widget size
 */
export function getWidgetPadding(size: 'small' | 'medium' | 'large'): string {
  const px = WIDGET_SIZES.PADDING[size];
  return `${px}px`;
}

/**
 * Get gap (spacing between child elements) based on widget size
 */
export function getWidgetGap(size: 'small' | 'medium' | 'large'): string {
  const px = WIDGET_SIZES.GAP[size];
  return `${px}px`;
}

/**
 * Get font sizes as CSS object for a widget size
 */
export function getWidgetFontSizes(size: 'small' | 'medium' | 'large') {
  return WIDGET_SIZES.FONT[size];
}

/**
 * Get icon size in pixels for a widget size
 */
export function getWidgetIconSize(size: 'small' | 'medium' | 'large'): number {
  return WIDGET_SIZES.ICON[size];
}

/**
 * Base widget container styling - use in all widgets
 */
export function getWidgetContainerClass(size: 'small' | 'medium' | 'large'): string {
  const height = getWidgetHeight(size);
  const padding = getWidgetPadding(size);
  return `h-[${height}px] p-[${padding}]`;
}

/**
 * Tailwind height utility - for grid layout
 * Use: className={`${getWidgetHeightClass(size)}`}
 */
export function getWidgetHeightClass(size: 'small' | 'medium' | 'large'): string {
  const heightMap = {
    small: 'h-auto min-h-[160px]',    // min 160px, grows with content
    medium: 'h-auto min-h-[280px]',   // min 280px, grows with content
    large: 'h-auto min-h-[360px]',    // min 360px, grows with content
  };
  return heightMap[size];
}

/**
 * Class for flex container inside widgets with proper spacing
 */
export function getWidgetFlexClass(
  size: 'small' | 'medium' | 'large',
  direction: 'row' | 'col' = 'col'
): string {
  const gap = {
    small: 'gap-1.5',
    medium: 'gap-2',
    large: 'gap-3',
  }[size];

  return `flex flex-${direction} ${gap}`;
}

/**
 * Text classes for widget titles/labels
 */
export function getWidgetLabelClass(size: 'small' | 'medium' | 'large'): string {
  const sizes = {
    small: 'text-xs',   // 12px
    medium: 'text-sm',  // 14px
    large: 'text-base', // 16px
  };
  return `${sizes[size]} font-semibold text-muted-foreground`;
}

/**
 * Text classes for main values
 */
export function getWidgetValueClass(size: 'small' | 'medium' | 'large'): string {
  const sizes = {
    small: 'text-xl',   // 20px
    medium: 'text-3xl', // 30px
    large: 'text-5xl',  // 48px
  };
  return `${sizes[size]} font-bold text-foreground`;
}

/**
 * Text classes for descriptions/secondary info
 */
export function getWidgetDescriptionClass(size: 'small' | 'medium' | 'large'): string {
  const sizes = {
    small: 'text-[10px]', // 10px
    medium: 'text-xs',    // 12px
    large: 'text-sm',     // 14px
  };
  return `${sizes[size]} text-muted-foreground`;
}
