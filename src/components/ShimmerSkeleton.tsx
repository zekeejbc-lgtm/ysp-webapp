interface ShimmerSkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
}

export const ShimmerSkeleton = ({ 
  className = "", 
  width = "100%", 
  height = "1rem",
  rounded = "0.5rem"
}: ShimmerSkeletonProps) => {
  return (
    <div
      className={`shimmer-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded,
        background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
};

export const ShimmerSkeletonDark = ({ 
  className = "", 
  width = "100%", 
  height = "1rem",
  rounded = "0.5rem"
}: ShimmerSkeletonProps) => {
  return (
    <div
      className={`shimmer-skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius: rounded,
        background: "linear-gradient(90deg, #2d2d2d 25%, #3d3d3d 50%, #2d2d2d 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
      }}
    />
  );
};

interface ShimmerTextProps {
  isDark?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  isLoading?: boolean;
}

export const ShimmerText = ({ 
  isDark = false, 
  className = "", 
  style = {},
  children,
  isLoading = true
}: ShimmerTextProps) => {
  if (!isLoading && children) {
    return <>{children}</>;
  }

  return (
    <span
      className={`shimmer-text ${className}`}
      style={{
        ...style,
        background: isDark 
          ? "linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.1) 75%)"
          : "linear-gradient(90deg, rgba(246,66,31,0.3) 25%, rgba(238,135,36,0.5) 50%, rgba(246,66,31,0.3) 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 2s infinite",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        color: "transparent",
        display: "inline-block",
      }}
    >
      {children || "Loading..."}
    </span>
  );
};

interface ShimmerContentCardProps {
  isDark?: boolean;
  isLoading?: boolean;
}

export const ShimmerContentCard = ({ isDark = false, isLoading = true }: ShimmerContentCardProps) => {
  if (!isLoading) return null;

  const SkeletonComponent = isDark ? ShimmerSkeletonDark : ShimmerSkeleton;

  return (
    <div className="space-y-4">
      <SkeletonComponent width="40%" height="2rem" />
      <SkeletonComponent width="100%" height="1rem" />
      <SkeletonComponent width="100%" height="1rem" />
      <SkeletonComponent width="95%" height="1rem" />
      <SkeletonComponent width="100%" height="1rem" />
      <SkeletonComponent width="90%" height="1rem" />
    </div>
  );
};
