"use client";

import React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  typography,
  icons,
  buttons,
  getTextStyle,
  getButtonStyle,
  getIconStyle,
  type TextContext,
  type ButtonContext,
  type IconContext,
  type IconSize
} from "@/lib/design-system";

// ============================================
// TEXT COMPONENTS
// ============================================

interface TextProps extends React.HTMLAttributes<HTMLElement> {
  as?: keyof JSX.IntrinsicElements;
  context?: TextContext;
  variant?: keyof typeof typography.sizes;
  color?: keyof typeof typography.colors;
  weight?: keyof typeof typography.weights;
}

/**
 * Smart Text component that applies design system rules
 */
export function Text({
  as: Component = "span",
  context,
  variant,
  color,
  weight,
  className,
  children,
  ...props
}: TextProps) {
  const styles = cn(
    // Apply context style if provided
    context && getTextStyle(context),
    // Or apply individual properties
    variant && typography.sizes[variant],
    color && typography.colors[color],
    weight && typography.weights[weight],
    className
  );

  return (
    <Component className={styles} {...props}>
      {children}
    </Component>
  );
}

// Convenience components for common text elements
export const PageTitle = ({ className, ...props }: TextProps) => (
  <Text as="h1" context="pageTitle" className={className} {...props} />
);

export const PageSubtitle = ({ className, ...props }: TextProps) => (
  <Text as="p" context="pageSubtitle" className={className} {...props} />
);

export const SectionTitle = ({ className, ...props }: TextProps) => (
  <Text as="h2" context="cardTitle" className={className} {...props} />
);

export const Label = ({ className, ...props }: TextProps) => (
  <Text as="label" context="inputLabel" className={className} {...props} />
);

export const HelperText = ({ className, ...props }: TextProps) => (
  <Text as="span" context="inputHelper" className={className} {...props} />
);

export const ErrorText = ({ className, ...props }: TextProps) => (
  <Text as="span" context="inputError" className={className} {...props} />
);

// ============================================
// ICON COMPONENTS
// ============================================

interface IconProps extends React.HTMLAttributes<SVGElement> {
  icon: LucideIcon;
  size?: IconSize;
  context?: IconContext;
  color?: keyof typeof icons.colors;
  animation?: keyof typeof icons.animations;
}

/**
 * Smart Icon component that applies design system rules
 */
export function Icon({
  icon: IconComponent,
  size = "md",
  context,
  color = "default",
  animation,
  className,
  ...props
}: IconProps) {
  const styles = cn(
    // Apply context style if provided
    context ? getIconStyle(context) : icons.sizes[size],
    // Apply color
    icons.colors[color],
    // Apply animation if specified
    animation && icons.animations[animation],
    className
  );

  return <IconComponent className={styles} {...props} />;
}

// ============================================
// BUTTON COMPONENTS
// ============================================

interface SmartButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  context?: ButtonContext;
  variant?: keyof typeof buttons.variants;
  size?: keyof typeof buttons.sizes;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
}

/**
 * Smart Button that automatically applies context-appropriate styles
 */
export function SmartButton({
  context,
  variant = "primary",
  size = "content",
  icon: IconComponent,
  iconPosition = "left",
  className,
  children,
  ...props
}: SmartButtonProps) {
  const styles = cn(
    buttons.base,
    // Apply context preset if provided
    context ? getButtonStyle(context) : [
      buttons.sizes[size],
      buttons.variants[variant]
    ],
    className
  );

  return (
    <button className={styles} {...props}>
      {IconComponent && iconPosition === "left" && (
        <IconComponent className={cn(
          size === "compact" ? "h-3.5 w-3.5" : "h-4 w-4",
          children && "mr-2"
        )} />
      )}
      {children}
      {IconComponent && iconPosition === "right" && (
        <IconComponent className={cn(
          size === "compact" ? "h-3.5 w-3.5" : "h-4 w-4",
          children && "ml-2"
        )} />
      )}
    </button>
  );
}

// ============================================
// LAYOUT COMPONENTS
// ============================================

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent page header component
 */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("border-b border-gray-200", className)}>
      <div className="flex h-14 items-center justify-between px-6">
        <div>
          <PageTitle>{title}</PageTitle>
          {subtitle && <PageSubtitle>{subtitle}</PageSubtitle>}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * Consistent content area wrapper
 */
export function ContentArea({ children, className, noPadding }: ContentAreaProps) {
  return (
    <div className={cn(
      !noPadding && "px-6 py-4",
      className
    )}>
      {children}
    </div>
  );
}

interface CardProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Consistent card component
 */
export function Card({ title, description, children, className }: CardProps) {
  return (
    <div className={cn("rounded-lg border border-gray-200 bg-white", className)}>
      {(title || description) && (
        <div className="px-4 py-3 border-b border-gray-200">
          {title && <SectionTitle>{title}</SectionTitle>}
          {description && (
            <Text context="cardDescription" className="mt-1">
              {description}
            </Text>
          )}
        </div>
      )}
      <div className="px-4 py-4">
        {children}
      </div>
    </div>
  );
}

// ============================================
// COMPOSITE COMPONENTS
// ============================================

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Consistent empty state component
 */
export function EmptyState({
  icon: IconComponent,
  title,
  description,
  primaryAction,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      {IconComponent && (
        <IconComponent className="h-12 w-12 text-gray-400 mb-4" />
      )}
      <Text context="emptyTitle" className="mb-2">
        {title}
      </Text>
      {description && (
        <Text context="emptyDescription" className="mb-6 text-center max-w-md">
          {description}
        </Text>
      )}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3">
          {primaryAction && (
            <SmartButton
              context="emptyPrimary"
              onClick={primaryAction.onClick}
            >
              {primaryAction.label}
            </SmartButton>
          )}
          {secondaryAction && (
            <SmartButton
              context="emptySecondary"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </SmartButton>
          )}
        </div>
      )}
    </div>
  );
}