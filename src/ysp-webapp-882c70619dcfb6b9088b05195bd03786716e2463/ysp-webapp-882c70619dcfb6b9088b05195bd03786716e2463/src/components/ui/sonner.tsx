"use client";

import React from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

function getThemeFromDom(): ToasterProps["theme"] {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = React.useState<ToasterProps["theme"]>(getThemeFromDom());
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );

  React.useEffect(() => {
    const update = () => setTheme(getThemeFromDom());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const isDark = theme === "dark";

  return (
    <Sonner
      theme={theme}
      // Respect explicit position passed in props; otherwise pick a sensible default per device
      position={props.position ?? (isMobile ? "bottom-center" : "top-right")}
      richColors
      closeButton
      expand
      visibleToasts={isMobile ? 3 : 5}
      className="toaster group"
      duration={3000}
      offset={isMobile ? "calc(16px + env(safe-area-inset-bottom))" : 16}
      toastOptions={{
        classNames: {
          toast: [
            isDark ? "bg-neutral-900/95 text-white" : "",
            // Slight glass + motion polish
            "border shadow-lg backdrop-blur-sm",
          ].join(" ").trim() || undefined,
          title: isDark ? "text-white" : undefined,
          description: isDark ? "text-neutral-200" : undefined,
          actionButton: isDark ? "bg-white/10 text-white hover:bg-white/20" : undefined,
          cancelButton: isDark ? "bg-neutral-800 text-white hover:bg-neutral-700" : undefined,
          closeButton: isDark ? "text-neutral-300 hover:text-white" : undefined,
        },
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
      } as React.CSSProperties}
      {...props}
    />
  );
};

export { Toaster };
