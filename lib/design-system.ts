/**
 * Isla Design System
 * Central configuration for all UI elements
 * Update here to apply changes globally
 */

import { type LucideIcon } from "lucide-react";

// ============================================
// TYPOGRAPHY SYSTEM
// ============================================

export const typography = {
  // Font families
  fonts: {
    sans: "var(--font-sans)",
    mono: "var(--font-mono)",
  },

  // Font sizes with line heights
  sizes: {
    // Display
    display1: "text-5xl leading-tight",    // 48px
    display2: "text-4xl leading-tight",    // 36px

    // Headings
    h1: "text-3xl leading-tight",          // 30px
    h2: "text-2xl leading-tight",          // 24px
    h3: "text-xl leading-snug",            // 20px
    h4: "text-lg leading-snug",            // 18px
    h5: "text-base font-medium",           // 16px
    h6: "text-sm font-medium",             // 14px

    // Body
    bodyXl: "text-lg leading-relaxed",     // 18px
    bodyLg: "text-base leading-relaxed",   // 16px
    body: "text-sm leading-normal",        // 14px
    bodySm: "text-xs leading-normal",      // 12px
    bodyXs: "text-[11px] leading-normal",  // 11px

    // UI Elements
    button: "text-sm font-medium",         // 14px
    buttonSm: "text-xs font-medium",       // 12px
    buttonLg: "text-base font-medium",     // 16px

    label: "text-sm font-medium",          // 14px
    caption: "text-xs",                    // 12px
    helper: "text-xs",                     // 12px
    badge: "text-[10px] font-medium",      // 10px
  },

  // Font weights
  weights: {
    thin: "font-thin",           // 100
    light: "font-light",         // 300
    normal: "font-normal",       // 400
    medium: "font-medium",       // 500
    semibold: "font-semibold",  // 600
    bold: "font-bold",           // 700
    extrabold: "font-extrabold", // 800
  },

  // Text colors
  colors: {
    primary: "text-gray-900",
    secondary: "text-gray-700",
    tertiary: "text-gray-600",
    muted: "text-gray-500",
    disabled: "text-gray-400",

    // Semantic colors
    error: "text-red-600",
    warning: "text-amber-600",
    success: "text-green-600",
    info: "text-blue-600",

    // Inverse
    inverse: "text-white",
    inverseMuted: "text-gray-300",
  },

  // Context-specific combinations
  contexts: {
    // Page headers
    pageTitle: "text-lg font-semibold text-gray-900",
    pageSubtitle: "text-sm text-gray-600",

    // Navigation
    navHeader: "text-lg font-semibold text-gray-900",
    navSection: "text-[11px] font-medium uppercase tracking-wider text-gray-400",
    navItem: "text-sm text-gray-700",
    navItemActive: "text-sm font-medium text-gray-900",

    // Cards/Panels
    cardTitle: "text-base font-semibold text-gray-900",
    cardDescription: "text-sm text-gray-600",

    // Tables
    tableHeader: "text-xs font-medium uppercase tracking-wider text-gray-500",
    tableCell: "text-sm text-gray-900",
    tableCellSecondary: "text-sm text-gray-500",

    // Forms
    inputLabel: "text-sm font-medium text-gray-700",
    inputHelper: "text-xs text-gray-500",
    inputError: "text-xs text-red-500",
    inputPlaceholder: "text-gray-400",

    // Empty states
    emptyTitle: "text-xl font-semibold text-gray-900",
    emptyDescription: "text-sm text-gray-500",

    // Tooltips
    tooltip: "text-xs text-white",
  },
} as const;

// ============================================
// ICON SYSTEM
// ============================================

export const icons = {
  // Size classes
  sizes: {
    xs: "h-3 w-3",        // 12px
    sm: "h-3.5 w-3.5",    // 14px
    md: "h-4 w-4",        // 16px (default)
    lg: "h-5 w-5",        // 20px
    xl: "h-6 w-6",        // 24px
    "2xl": "h-8 w-8",     // 32px
    "3xl": "h-10 w-10",   // 40px
  },

  // Icon colors
  colors: {
    default: "text-gray-600",
    primary: "text-gray-900",
    secondary: "text-gray-500",
    muted: "text-gray-400",

    // Semantic
    error: "text-red-500",
    warning: "text-amber-500",
    success: "text-green-500",
    info: "text-blue-500",

    // Interactive states
    hover: "hover:text-gray-900",
    active: "text-gray-900",
    disabled: "text-gray-300",
  },

  // Context-specific icon styles
  contexts: {
    // Buttons
    buttonIcon: "h-4 w-4",
    buttonIconSm: "h-3.5 w-3.5",
    buttonIconLg: "h-5 w-5",

    // Navigation
    navIcon: "h-3.5 w-3.5",
    navIconLarge: "h-4 w-4",

    // Tables
    tableIcon: "h-4 w-4",
    tableSortIcon: "h-3 w-3",

    // Forms
    inputIcon: "h-4 w-4 text-gray-400",
    inputErrorIcon: "h-4 w-4 text-red-500",

    // Empty states
    emptyIcon: "h-12 w-12 text-gray-400",

    // Alerts
    alertIcon: "h-5 w-5",
  },

  // Animation classes
  animations: {
    spin: "animate-spin",
    pulse: "animate-pulse",
    bounce: "animate-bounce",
    none: "",
  },
} as const;

// ============================================
// BUTTON SYSTEM
// ============================================

export const buttons = {
  // Base styles (always applied)
  base: "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none antialiased subpixel-antialiased",

  // Size variants
  sizes: {
    // By context
    header: "h-9 px-4 text-sm",          // Page headers
    content: "h-10 px-4 text-sm",        // Main content
    compact: "h-8 px-3 text-xs",         // Tight spaces
    cta: "h-11 px-6 text-base",          // Call-to-action
    table: "h-7 px-2.5 text-xs",         // Table rows

    // Icon buttons
    icon: "h-9 w-9",
    iconSm: "h-8 w-8",
    iconLg: "h-10 w-10",
  },

  // Style variants
  variants: {
    primary: "bg-black text-white hover:bg-gray-800",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-gray-600 hover:bg-gray-100",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50",
    link: "text-blue-600 underline-offset-4 hover:underline",
  },

  // Context-specific presets
  contexts: {
    // Page header buttons
    headerCreate: "h-9 px-4 bg-black text-white hover:bg-gray-800 text-sm font-medium antialiased",
    headerAction: "h-9 px-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm antialiased",

    // Content area buttons
    contentPrimary: "h-10 px-4 bg-black text-white hover:bg-gray-800 text-sm antialiased",
    contentSecondary: "h-10 px-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm antialiased",

    // Empty state CTAs
    emptyPrimary: "h-10 px-5 bg-black text-white hover:bg-gray-800 text-sm font-medium antialiased",
    emptySecondary: "h-10 px-5 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm antialiased",

    // Table/List actions
    tableAction: "h-7 px-2.5 text-xs text-gray-600 hover:bg-gray-100 rounded antialiased",
    tableDelete: "h-7 px-2.5 text-xs text-red-600 hover:bg-red-50 rounded antialiased",
  },
} as const;

// ============================================
// SPACING SYSTEM
// ============================================

export const spacing = {
  // Page structure
  page: {
    header: "h-14",
    headerPadding: "px-6",
    contentPadding: "px-6 py-4",
    sectionGap: "space-y-6",
  },

  // Navigation
  nav: {
    width: "w-56",
    iconWidth: "w-16",
    padding: "px-4 py-2",
    sectionGap: "mb-5",
    itemGap: "space-y-1",
  },

  // Cards & Panels
  card: {
    padding: "p-4",
    headerPadding: "px-4 py-3",
    contentPadding: "px-4 py-4",
    gap: "space-y-4",
  },

  // Tables
  table: {
    headerPadding: "px-6 py-3",
    cellPadding: "px-6 py-4",
    compactCellPadding: "px-4 py-2",
  },

  // Forms
  form: {
    groupGap: "space-y-4",
    fieldGap: "space-y-2",
    labelGap: "space-y-1.5",
  },

  // Modals
  modal: {
    padding: "p-6",
    headerPadding: "px-6 py-4",
    contentPadding: "px-6 py-4",
    footerPadding: "px-6 py-4",
  },
} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get appropriate text style for context
 */
export function getTextStyle(context: keyof typeof typography.contexts) {
  return typography.contexts[context];
}

/**
 * Get appropriate button style for context
 */
export function getButtonStyle(context: keyof typeof buttons.contexts) {
  return buttons.contexts[context];
}

/**
 * Get appropriate icon size for context
 */
export function getIconStyle(context: keyof typeof icons.contexts) {
  return icons.contexts[context];
}

/**
 * Combine multiple class strings
 */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// Export type helpers
export type TextContext = keyof typeof typography.contexts;
export type ButtonContext = keyof typeof buttons.contexts;
export type IconContext = keyof typeof icons.contexts;
export type IconSize = keyof typeof icons.sizes;
export type ButtonSize = keyof typeof buttons.sizes;