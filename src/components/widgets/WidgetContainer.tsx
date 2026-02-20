import { ReactNode } from "react";
import { WidgetSize } from "@/lib/dashboardWidgets";

interface WidgetContainerProps {
  children: ReactNode;
  size: WidgetSize;
  isEditMode?: boolean;
}

/**
 * Standardized widget container with consistent padding, spacing, and styling
 * Ensures all widgets have harmonious appearance and proper readability
 */
export function WidgetContainer({ children, size, isEditMode }: WidgetContainerProps) {
  // Consistent padding based on widget size
  const paddingMap = {
    small: 'p-4',    // 16px padding
    medium: 'p-5',   // 20px padding
    large: 'p-6',    // 24px padding
  };

  return (
    <div
      className={`
        rounded-2xl bg-card shadow-card border border-border/50
        ${paddingMap[size]}
        ${isEditMode ? 'hover:shadow-lg' : ''}
        transition-shadow duration-200 h-full flex flex-col
      `}
    >
      {children}
    </div>
  );
}

/**
 * Widget title - standardized styling for consistency
 */
export function WidgetTitle({ children, size }: { children: ReactNode; size: WidgetSize }) {
  const sizeMap = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  };

  return (
    <h3 className={`font-semibold text-foreground mb-4 ${sizeMap[size]}`}>
      {children}
    </h3>
  );
}

/**
 * Widget content area with standardized spacing
 */
export function WidgetContent({ children, size }: { children: ReactNode; size: WidgetSize }) {
  const gapMap = {
    small: 'space-y-2',
    medium: 'space-y-3',
    large: 'space-y-4',
  };

  return <div className={`flex-1 ${gapMap[size]}`}>{children}</div>;
}

/**
 * Empty state for widgets with no data
 */
export function WidgetEmptyState({ icon, title, description, dataNeeded }: {
  icon: string;
  title: string;
  description: string;
  dataNeeded?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-center py-4">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-2">{description}</p>
      {dataNeeded && (
        <p className="text-xs text-muted-foreground/75">Data needed: {dataNeeded}</p>
      )}
    </div>
  );
}
