"use client";

import React from "react";
import { Toaster as Sonner, ToasterProps } from "sonner";

function getThemeFromDom(): ToasterProps["theme"] {
  if (typeof window === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

const Toaster = ({ ...props }: ToasterProps) => {
  const [theme, setTheme] = React.useState<ToasterProps["theme"]>(getThemeFromDom());

  React.useEffect(() => {
    const update = () => setTheme(getThemeFromDom());
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const isDark = theme === "dark";

  return (
    <Sonner
      theme={theme}
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: isDark ? "bg-neutral-900/95 text-white" : undefined,
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
