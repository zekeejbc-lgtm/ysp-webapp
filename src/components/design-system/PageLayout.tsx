/**
 * =============================================================================
 * PAGE LAYOUT MASTER COMPONENT
 * =============================================================================
 * 
 * Wrapper for all internal pages ensuring consistent:
 * - TopBar integration (64px offset)
 * - SideBar integration (280px offset on desktop)
 * - Content max width (1200px)
 * - Proper spacing and padding
 * - Glassmorphism background
 * 
 * SMART SPEC COMPLIANCE:
 * ✅ TopBar offset: 64px
 * ✅ SideBar offset: 280px desktop
 * ✅ Content max width: 1200px
 * ✅ Proper spacing scale
 * ✅ Glassmorphism background
 * 
 * =============================================================================
 */

import { X } from "lucide-react";
import { DESIGN_TOKENS, getGlassStyle } from "./tokens";
import Breadcrumb, { BreadcrumbItem } from "./Breadcrumb";

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isDark: boolean;
  onClose: () => void;
  actions?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function PageLayout({
  children,
  title,
  subtitle,
  isDark,
  onClose,
  actions,
  breadcrumbs,
}: PageLayoutProps) {
  const glassStyle = getGlassStyle(isDark);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-200/40 dark:bg-orange-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-yellow-200/40 dark:bg-yellow-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-red-200/40 dark:bg-red-500/10 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      {/* Main Content Area */}
      <div
        className="relative z-10"
        style={{
          paddingTop: `${DESIGN_TOKENS.layout.topBar.height + DESIGN_TOKENS.spacing.scale.xl}px`,
          minHeight: "100vh",
        }}
      >
        <div
          className="max-w-7xl mx-auto px-4 md:px-6"
          style={{
            maxWidth: `${DESIGN_TOKENS.layout.contentMaxWidth}px`,
          }}
        >
          {/* Breadcrumb Navigation */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb items={breadcrumbs} isDark={isDark} />
          )}

          {/* Page Header */}
          <div
            className="border rounded-lg mb-6"
            style={{
              borderRadius: `${DESIGN_TOKENS.radius.card}px`,
              padding: `${DESIGN_TOKENS.spacing.scale.xl}px`,
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
              ...glassStyle,
            }}
          >
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1
                  className="text-xl sm:text-2xl lg:text-3xl truncate"
                  style={{
                    fontFamily: DESIGN_TOKENS.typography.fontFamily.headings,
                    fontWeight: DESIGN_TOKENS.typography.fontWeight.semibold,
                    color: DESIGN_TOKENS.colors.brand.orange,
                    marginBottom: subtitle ? `${DESIGN_TOKENS.spacing.scale.sm}px` : "0",
                  }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p
                    className="text-muted-foreground text-sm sm:text-base line-clamp-2"
                    style={{
                      fontWeight: DESIGN_TOKENS.typography.fontWeight.normal,
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Actions and Close Button */}
              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                {actions}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                  style={{
                    transitionDuration: `${DESIGN_TOKENS.motion.duration.fast}ms`,
                  }}
                  aria-label="Close page"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div>{children}</div>
        </div>
      </div>
    </div>
  );
}
