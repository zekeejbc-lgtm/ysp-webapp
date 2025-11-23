import { useMemo } from "react";
import { motion } from "framer-motion";

type JSXIntrinsic = keyof JSX.IntrinsicElements;

function cn(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

interface TextShimmerProps {
  children: string;
  as?: React.ElementType;
  className?: string;
  duration?: number;
  spread?: number;
}

export function TextShimmer({
  children,
  as: Component = "span",
  className,
  duration = 2,
  spread = 2,
}: TextShimmerProps) {
  const MotionComponent = motion.create(Component as JSXIntrinsic);

  const dynamicSpread = useMemo(() => {
    return (children?.length || 0) * spread;
  }, [children, spread]);

  return (
    <MotionComponent
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text",
        "text-transparent [--base-color:#a1a1aa] [--base-gradient-color:#000]",
        "[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))] [background-repeat:no-repeat,padding-box]",
        "dark:[--base-color:#71717a] dark:[--base-gradient-color:#ffffff] dark:[--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),var(--base-gradient-color),#0000_calc(50%+var(--spread)))]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      animate={{ backgroundPosition: "0% center" }}
      transition={{ repeat: Infinity, duration, ease: "linear" }}
      style={{
        // @ts-expect-error CSS var type
        "--spread": `${dynamicSpread}px`,
        backgroundImage: `var(--bg), linear-gradient(var(--base-color), var(--base-color))`,
      }}
    >
      {children}
    </MotionComponent>
  );
}
