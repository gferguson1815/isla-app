import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "default" | "inverted" | "gradient" | "wave" | "dot";
  type?: "icon" | "wordmark";
}

export function Logo({
  size = "md",
  className,
  variant = "default",
  type = "icon"
}: LogoProps) {
  const sizeClasses = {
    sm: {
      container: "w-10 h-10",
      text: "text-[22px]",
      rounded: "rounded-[10px]",
      wordmark: "text-[18px]",
      dot: "w-3 h-3",
      stem: "w-[3px] h-4",
    },
    md: {
      container: "w-14 h-14",
      text: "text-[32px]",
      rounded: "rounded-[14px]",
      wordmark: "text-[24px]",
      dot: "w-4 h-4",
      stem: "w-[4px] h-5",
    },
    lg: {
      container: "w-16 h-16",
      text: "text-[36px]",
      rounded: "rounded-[16px]",
      wordmark: "text-[28px]",
      dot: "w-5 h-5",
      stem: "w-[4px] h-6",
    },
    xl: {
      container: "w-20 h-20",
      text: "text-[44px]",
      rounded: "rounded-[20px]",
      wordmark: "text-[36px]",
      dot: "w-6 h-6",
      stem: "w-[5px] h-8",
    },
  };

  const { container, text, rounded, wordmark, dot, stem } = sizeClasses[size];

  const variants = {
    default: {
      bg: "bg-black",
      textColor: "text-white",
      dotColor: "bg-white",
    },
    inverted: {
      bg: "bg-white",
      textColor: "text-black",
      dotColor: "bg-black",
    },
    gradient: {
      bg: "bg-gradient-to-br from-indigo-500 to-purple-600",
      textColor: "text-white",
      dotColor: "bg-white",
    },
    wave: {
      bg: "bg-gradient-to-br from-blue-500 to-cyan-400",
      textColor: "text-white",
      dotColor: "bg-white",
    },
    dot: {
      bg: "bg-black",
      textColor: "text-white",
      dotColor: "bg-white",
    },
  };

  const { bg, textColor, dotColor } = variants[variant];

  // Wordmark version - using "isla" text (keeps rounded square for better text fit)
  if (type === "wordmark") {
    return (
      <div
        className={cn(
          container,
          bg,
          rounded,
          "flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105",
          className
        )}
      >
        <span
          className={cn(wordmark, textColor, "font-black tracking-tight")}
          style={{
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          }}
        >
          isla
        </span>
      </div>
    );
  }

  // Dot-focused version - large dot with small stem
  if (variant === "dot") {
    return (
      <div
        className={cn(
          container,
          bg,
          rounded,
          "flex flex-col items-center justify-center gap-1 shadow-2xl transition-all duration-200 hover:scale-105",
          className
        )}
      >
        <div className={cn(dot, dotColor, "rounded-full")} />
        <div className={cn(stem, dotColor, "rounded-full")} />
      </div>
    );
  }

  // Default icon version - Lora bold lowercase "i"
  return (
    <div
      className={cn(
        container,
        bg,
        rounded, // Rounded square for icon version
        "flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-105",
        className
      )}
    >
      <span
        className={cn(textColor)}
        style={{
          fontFamily: "'Lora', Georgia, serif",
          fontSize: size === 'sm' ? '36px' : size === 'md' ? '48px' : size === 'lg' ? '56px' : '68px',
          fontWeight: 700,
        }}
      >
        i
      </span>
    </div>
  );
}