import { cva, type VariantProps } from "class-variance-authority";

/**
 * Button size variants for different contexts
 * Ensures consistent sizing across the application
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background antialiased",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
        primary: "bg-black text-white hover:bg-gray-800",
      },
      size: {
        // Header context - smaller, more compact
        header: "h-9 px-4 text-sm",

        // Main content context - standard size
        default: "h-10 px-4 py-2 text-sm",

        // Empty states / CTAs - larger for emphasis
        cta: "h-11 px-6 text-base",

        // Inline/compact - for tight spaces
        sm: "h-8 px-3 text-xs rounded-md",

        // Icon only buttons
        icon: "h-9 w-9",
        iconSm: "h-8 w-8",
        iconLg: "h-10 w-10",

        // Table/list actions
        table: "h-7 px-2.5 text-xs",

        // Navigation panel
        nav: "h-auto py-2 px-2.5 text-sm",
      },
      context: {
        // Page header (title bar area)
        pageHeader: "h-9 px-4 text-sm font-medium",

        // Page content (main area)
        pageContent: "h-10 px-4 text-sm",

        // Modal/dialog actions
        modal: "h-10 px-4 text-sm",

        // Empty states
        emptyState: "h-10 px-5 text-sm",

        // Navigation
        navigation: "h-auto py-2 px-3 text-sm",

        // Toolbar
        toolbar: "h-8 px-3 text-xs",

        // Footer
        footer: "h-9 px-4 text-sm",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;

/**
 * Text size system for consistency
 */
export const textSizes = {
  // Headings
  h1: "text-2xl font-semibold tracking-tight",
  h2: "text-xl font-semibold tracking-tight",
  h3: "text-lg font-semibold",
  h4: "text-base font-semibold",
  h5: "text-sm font-medium",
  h6: "text-xs font-medium uppercase tracking-wider",

  // Body text
  body: "text-sm",
  bodyLg: "text-base",
  bodySm: "text-xs",

  // UI text
  label: "text-sm font-medium",
  caption: "text-xs text-gray-500",
  helper: "text-xs text-gray-600",
  error: "text-xs text-red-600",

  // Navigation
  navItem: "text-sm",
  navHeader: "text-lg font-semibold",
  navSection: "text-[11px] font-medium uppercase tracking-wider text-gray-400",

  // Page context
  pageTitle: "text-lg font-semibold",
  pageSubtitle: "text-sm text-gray-600",
  sectionTitle: "text-base font-semibold",

  // Table/List
  tableHeader: "text-xs font-medium uppercase tracking-wider",
  tableCell: "text-sm",

  // Form
  inputLabel: "text-sm font-medium",
  inputHelper: "text-xs text-gray-500",
  inputError: "text-xs text-red-500",
} as const;

/**
 * Spacing system for consistent padding/margins
 */
export const spacing = {
  // Page layout
  pageHeader: "h-14 px-6",
  pageContent: "px-6 py-4",
  pageSection: "mb-6",

  // Card/Panel
  cardPadding: "p-4",
  cardHeader: "px-4 py-3",
  cardContent: "px-4 py-4",

  // Modal/Dialog
  modalPadding: "p-6",
  modalHeader: "px-6 py-4",
  modalContent: "px-6 py-4",
  modalFooter: "px-6 py-4",

  // Navigation
  navPadding: "px-4 py-2",
  navSection: "mb-5",
  navItem: "px-2.5 py-2",

  // Table
  tableHeader: "px-6 py-3",
  tableCell: "px-6 py-4",

  // Form
  formGroup: "space-y-2",
  formSection: "space-y-4",
  inputGroup: "space-y-1.5",
} as const;

/**
 * Icon sizes for buttons and UI elements
 */
export const iconSizes = {
  xs: "h-3 w-3",
  sm: "h-3.5 w-3.5",
  default: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
} as const;

/**
 * Common button combinations
 */
export const buttonPresets = {
  // Header actions
  headerPrimary: "h-9 px-4 bg-black text-white hover:bg-gray-800 text-sm font-medium antialiased",
  headerSecondary: "h-9 px-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm antialiased",
  headerGhost: "h-9 px-4 text-gray-600 hover:bg-gray-100 text-sm antialiased",

  // Content actions
  contentPrimary: "h-10 px-4 bg-black text-white hover:bg-gray-800 text-sm antialiased",
  contentSecondary: "h-10 px-4 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-sm antialiased",
  contentDanger: "h-10 px-4 bg-red-600 text-white hover:bg-red-700 text-sm antialiased",

  // Empty state CTAs
  ctaPrimary: "h-11 px-6 bg-black text-white hover:bg-gray-800 text-base font-medium antialiased",
  ctaSecondary: "h-11 px-6 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 text-base antialiased",

  // Table/List actions
  tableAction: "h-7 px-2.5 text-xs text-gray-600 hover:bg-gray-100 antialiased",
  tableDelete: "h-7 px-2.5 text-xs text-red-600 hover:bg-red-50 antialiased",

  // Icon buttons
  iconButton: "h-9 w-9 text-gray-600 hover:bg-gray-100 rounded-lg antialiased",
  iconButtonSm: "h-8 w-8 text-gray-600 hover:bg-gray-100 rounded-md antialiased",

  // Navigation
  navItem: "w-full justify-start h-auto py-2 px-2.5 text-sm hover:bg-gray-100 antialiased",
  navItemActive: "w-full justify-start h-auto py-2 px-2.5 text-sm bg-gray-200 font-medium antialiased",
} as const;