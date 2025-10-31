# YSP Web App - Design System for Figma

Complete CSS design tokens and styles for Figma redesign.

---

## 🎨 Brand Colors (Primary Palette)

```css
/* YSP Brand Colors */
--ysp-primary: #f6421f;      /* YSP Red (Primary brand) */
--ysp-secondary: #ee8724;    /* YSP Orange (Secondary brand) */
--ysp-accent: #fbcb29;       /* YSP Yellow (Accent) */
```

---

## 🌈 UI Colors - Light Mode

```css
/* Backgrounds */
--background: #ffffff;
--card: #ffffff;
--popover: oklch(1 0 0);
--input-background: #f3f3f5;

/* Foreground/Text */
--foreground: oklch(0.145 0 0);
--card-foreground: oklch(0.145 0 0);
--popover-foreground: oklch(0.145 0 0);
--muted-foreground: #717182;

/* Borders & Inputs */
--border: rgba(0, 0, 0, 0.1);
--input: transparent;
--ring: oklch(0.708 0 0);

/* Buttons & Actions */
--primary: #030213;
--primary-foreground: oklch(1 0 0);
--secondary: oklch(0.95 0.0058 264.53);
--secondary-foreground: #030213;
--destructive: #d4183d;
--destructive-foreground: #ffffff;

/* Neutral Tones */
--muted: #ececf0;
--accent: #e9ebef;
--accent-foreground: #030213;
--switch-background: #cbced4;
```

---

## 🌙 UI Colors - Dark Mode

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  
  --destructive: oklch(0.396 0.141 25.723);
  --destructive-foreground: oklch(0.637 0.237 25.331);
  
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
}
```

---

## 🎨 Extended Color Palette

### Blues
```css
--color-blue-50: oklch(.97 .014 254.604);
--color-blue-100: oklch(.932 .032 255.585);
--color-blue-200: oklch(.882 .059 254.128);
--color-blue-400: oklch(.707 .165 254.624);
--color-blue-500: oklch(.623 .214 259.815);
--color-blue-600: oklch(.546 .245 262.881);
--color-blue-700: oklch(.488 .243 264.376);
--color-blue-800: oklch(.424 .199 265.638);
--color-blue-900: oklch(.379 .146 265.522);
```

### Reds
```css
--color-red-50: oklch(.971 .013 17.38);
--color-red-100: oklch(.936 .032 17.717);
--color-red-200: oklch(.885 .062 18.334);
--color-red-300: oklch(.808 .114 19.571);
--color-red-400: oklch(.704 .191 22.216);
--color-red-500: oklch(.637 .237 25.331);
--color-red-600: oklch(.577 .245 27.325);
--color-red-700: oklch(.505 .213 27.518);
--color-red-800: oklch(.444 .177 26.899);
--color-red-900: oklch(.396 .141 25.723);
```

### Greens
```css
--color-green-50: oklch(.982 .018 155.826);
--color-green-100: oklch(.962 .044 156.743);
--color-green-200: oklch(.925 .084 155.995);
--color-green-300: oklch(.871 .15 154.449);
--color-green-400: oklch(.792 .209 151.711);
--color-green-500: oklch(.723 .219 149.579);
--color-green-600: oklch(.627 .194 149.214);
--color-green-700: oklch(.527 .154 150.069);
--color-green-800: oklch(.448 .119 151.328);
--color-green-900: oklch(.393 .095 152.535);
```

### Yellows/Ambers
```css
--color-yellow-50: oklch(.987 .026 102.212);
--color-yellow-100: oklch(.973 .071 103.193);
--color-yellow-200: oklch(.945 .129 101.54);
--color-yellow-400: oklch(.852 .199 91.936);
--color-yellow-500: oklch(.795 .184 86.047);
--color-yellow-600: oklch(.681 .162 75.834);
--color-yellow-800: oklch(.476 .114 61.907);
--color-yellow-900: oklch(.421 .095 57.708);

--color-amber-50: oklch(.987 .022 95.277);
--color-amber-100: oklch(.962 .059 95.617);
--color-amber-600: oklch(.666 .179 58.318);
--color-amber-800: oklch(.473 .137 46.201);
--color-amber-900: oklch(.414 .112 45.904);
```

### Oranges
```css
--color-orange-50: oklch(.98 .016 73.684);
--color-orange-100: oklch(.954 .038 75.164);
--color-orange-300: oklch(.837 .128 66.29);
```

### Grays (Neutral)
```css
--color-gray-50: oklch(.985 .002 247.839);
--color-gray-100: oklch(.967 .003 264.542);
--color-gray-200: oklch(.928 .006 264.531);
--color-gray-300: oklch(.872 .01 258.338);
--color-gray-400: oklch(.707 .022 261.325);
--color-gray-500: oklch(.551 .027 264.364);
--color-gray-600: oklch(.446 .03 256.802);
--color-gray-700: oklch(.373 .034 259.733);
--color-gray-800: oklch(.278 .033 256.848);
--color-gray-900: oklch(.21 .034 264.665);
--color-white: #fff;
```

---

## 📝 Typography

```css
/* Font Families */
--font-sans: 'Roboto', sans-serif;        /* Body text */
--font-headings: 'Lexend', sans-serif;    /* Headings */

/* Font Sizes */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px - Base size */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */

/* Line Heights */
--text-xs--line-height: 1.333;
--text-sm--line-height: 1.43;
--text-base--line-height: 1.5;
--text-2xl--line-height: 1.333;
--text-3xl--line-height: 1.2;

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Leading */
--leading-relaxed: 1.625;
```

---

## 📏 Spacing System

```css
/* Base Spacing Unit */
--spacing: 0.25rem;  /* 4px base unit */

/* Common Spacing Values */
1  = 4px    /* gap-1, p-1, m-1 */
2  = 8px    /* gap-2, p-2, m-2 */
3  = 12px   /* gap-3, p-3, m-3 */
4  = 16px   /* gap-4, p-4, m-4 */
6  = 24px   /* gap-6, p-6, m-6 */
8  = 32px   /* gap-8, p-8, m-8 */
10 = 40px   /* p-10, m-10 */
12 = 48px   /* p-12, m-12 */
16 = 64px   /* h-16, w-16 */
20 = 80px   /* h-20, w-20 */
```

---

## 🔲 Border Radius

```css
/* Border Radius Tokens */
--radius: 0.625rem;  /* 10px - Base radius */

/* Radius Utilities */
rounded-sm: 6px     /* calc(var(--radius) - 4px) */
rounded-md: 8px     /* calc(var(--radius) - 2px) */
rounded-lg: 10px    /* var(--radius) */
rounded-full: 9999px

/* Common Usage */
- Cards: 16px (1rem)
- Buttons: 8px (0.5rem)
- Inputs: 8px (0.5rem)
- Modals: 16px (1rem)
```

---

## 🌟 Shadows (Elevation)

```css
/* Shadow Tokens */

/* Subtle Shadow */
shadow:
  0 1px 3px 0 rgba(0,0,0,0.1),
  0 1px 2px -1px rgba(0,0,0,0.1)

/* Medium Shadow */
shadow-md:
  0 4px 6px -1px rgba(0,0,0,0.1),
  0 2px 4px -2px rgba(0,0,0,0.1)

/* Large Shadow */
shadow-lg:
  0 10px 15px -3px rgba(0,0,0,0.1),
  0 4px 6px -4px rgba(0,0,0,0.1)

/* Extra Large Shadow */
shadow-xl:
  0 20px 25px -5px rgba(0,0,0,0.1),
  0 8px 10px -6px rgba(0,0,0,0.1)

/* Custom YSP Shadows */
YSP Card:
  0 8px 16px rgba(0, 0, 0, 0.1)

YSP Card Hover:
  0 12px 24px rgba(246, 66, 31, 0.15)

Modal Shadow:
  0 20px 40px rgba(0, 0, 0, 0.2)
```

---

## 🔘 Button Styles

### Primary YSP Button
```css
{
  background: 'linear-gradient(135deg, #f6421f 0%, #ee8724 100%)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '16px',
  transition: 'all 0.25s ease',
  boxShadow: '0 2px 8px rgba(246, 66, 31, 0.2)'
}

/* Hover State */
{
  transform: 'translateY(-2px)',
  boxShadow: '0 4px 12px rgba(246, 66, 31, 0.3)'
}

/* Active State */
{
  transform: 'translateY(0)'
}
```

### Outline Button
```css
{
  background: 'transparent',
  color: '#f6421f',
  border: '2px solid #f6421f',
  padding: '10px 22px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '16px',
  transition: 'all 0.25s ease'
}

/* Hover State */
{
  background: '#f6421f',
  color: 'white'
}
```

### Secondary Button (Blue)
```css
{
  background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: '500',
  transition: 'all 0.25s ease'
}
```

### Success Button (Green)
```css
{
  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: '500',
  transition: 'all 0.25s ease'
}
```

### Danger Button (Red)
```css
{
  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  fontWeight: '500',
  transition: 'all 0.25s ease'
}
```

---

## 🎨 Gradients

```css
/* YSP Brand Gradient (Primary) */
background: linear-gradient(135deg, #f6421f 0%, #ee8724 100%);

/* YSP Extended Gradient (with yellow) */
background: linear-gradient(135deg, #f6421f 0%, #ee8724 50%, #fbcb29 100%);

/* Background Gradients - Light Mode */
background: linear-gradient(135deg, #ffffff 0%, #fff5f0 50%, #ffe8dc 100%);

/* Background Gradients - Dark Mode */
background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);

/* Success Gradient */
background: linear-gradient(135deg, #10b981 0%, #059669 100%);

/* Info Gradient (Blue) */
background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);

/* Danger Gradient */
background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);

/* Warning Gradient */
background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
```

---

## ⚡ Animations & Transitions

```css
/* Default Transition */
--default-transition-duration: 0.15s;
--default-transition-timing: cubic-bezier(0.4, 0, 0.2, 1);

/* Common Durations */
duration-200: 0.2s
duration-250: 0.25s
duration-300: 0.3s

/* Easing Functions */
ease
ease-in
ease-out
ease-in-out

/* Component Transitions */
.ysp-card: all 0.3s ease
.ysp-button: all 0.25s ease
.modal-overlay: fadeIn 0.25s ease
.modal-content: scaleIn 0.3s ease
```

### Keyframe Animations

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { 
    opacity: 0;
    transform: scale(0.9);
  }
  to { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile-first approach */

/* xs: Default (< 640px) - Mobile */
/* sm: 640px  - Small tablets */
/* md: 768px  - Tablets / Small laptops */
/* lg: 1024px - Laptops */
/* xl: 1280px - Desktops */
/* 2xl: 1536px - Large screens */

/* Common Usage */
@media (width >= 768px) {
  /* md: Tablet and up */
}
```

---

## 📦 Container Sizes

```css
--container-md: 28rem;    /* 448px */
--container-2xl: 42rem;   /* 672px */
--container-4xl: 56rem;   /* 896px */
--container-5xl: 64rem;   /* 1024px */
--container-6xl: 72rem;   /* 1152px */
```

---

## 🎴 Custom Component Classes

### YSP Card
```css
.ysp-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(246, 66, 31, 0.1);
}

.ysp-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(246, 66, 31, 0.15);
}

/* Dark Mode */
.dark .ysp-card {
  background: rgba(30, 30, 30, 0.9);
  border-color: rgba(238, 135, 36, 0.2);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
}

.dark .ysp-card:hover {
  box-shadow: 0 12px 24px rgba(238, 135, 36, 0.25);
}
```

### YSP Button
```css
.ysp-button {
  background: linear-gradient(135deg, #f6421f 0%, #ee8724 100%);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 500;
}

.ysp-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(246, 66, 31, 0.3);
}

.ysp-button:active {
  transform: translateY(0);
}
```

### Modal Overlay
```css
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.25s ease;
}
```

### Modal Content
```css
.modal-content {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: scaleIn 0.3s ease;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.dark .modal-content {
  background: #2d2d2d;
  color: white;
}
```

---

## ♿ Accessibility

```css
/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Focus States */
focus-visible: {
  box-shadow: 0 0 0 3px var(--ring);
}

/* Touch Optimization */
* {
  touch-action: manipulation;
}

/* Smooth Scrolling */
html {
  scroll-behavior: smooth;
  scrollbar-gutter: stable;
}
```

---

## 🎯 Quick Reference

### Most Used Colors
```
Primary Brand: #f6421f (YSP Red)
Secondary Brand: #ee8724 (YSP Orange)
Accent: #fbcb29 (YSP Yellow)
Text Light: #030213 (Dark blue-black)
Text Dark: #fafafa (Near-white)
Border: rgba(0, 0, 0, 0.1)
```

### Most Used Spacing
```
4px  - gap-1, p-1, m-1
8px  - gap-2, p-2, m-2
12px - gap-3, p-3, m-3
16px - gap-4, p-4, m-4
24px - gap-6, p-6, m-6
```

### Most Used Border Radius
```
8px  - Buttons, inputs
10px - Default cards
16px - Large cards, modals
```

### Most Used Shadows
```
Subtle:   0 1px 3px rgba(0,0,0,0.1)
Card:     0 8px 16px rgba(0,0,0,0.1)
Elevated: 0 12px 24px rgba(246,66,31,0.15)
Modal:    0 20px 40px rgba(0,0,0,0.2)
```

---

## 🏠 Current Homepage Layout Structure

### Full Page Layout Specifications

```
┌────────────────────────────────────────────────────────────────────┐
│                          TOP BAR (Fixed)                            │
│  Height: 64px | z-index: 40 | Background: White/Dark               │
│  Padding: 0 16px (mobile) | 0 24px (desktop)                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Logo (40px) | Nav Links | Dark Toggle | Profile Avatar       │  │
│  └──────────────────────────────────────────────────────────────┘  │
├────────────────────────────────────────────────────────────────────┤
│                         MAIN CONTENT AREA                           │
│  Margin Top: 64px (offset for fixed topbar)                        │
│  Background: Linear gradient (light/dark mode aware)               │
│  Min Height: calc(100vh - 64px)                                    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                     HERO SECTION                            │   │
│  │  Padding Y: 48px (mobile) | 80px (desktop)                 │   │
│  │  Padding X: 16px (mobile) | 24px (desktop)                 │   │
│  │  Text Align: Center                                        │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  H1: 30px (mobile) → 48px (desktop)                  │  │   │
│  │  │  Color: #f6421f | Font: Lexend Bold                  │  │   │
│  │  │  Margin Bottom: 16px                                  │  │   │
│  │  ├──────────────────────────────────────────────────────┤  │   │
│  │  │  Subtitle: 18px (mobile) → 20px (desktop)            │  │   │
│  │  │  Color: Gray 600/400 | Line Height: 1.5              │  │   │
│  │  │  Margin Bottom: 24px                                  │  │   │
│  │  ├──────────────────────────────────────────────────────┤  │   │
│  │  │  Button Group: Flex Row (wrap on mobile)             │  │   │
│  │  │  Gap: 16px | Justify: Center                         │  │   │
│  │  │  - Primary Button: 140px width                        │  │   │
│  │  │  - Secondary Button: 140px width                      │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   ABOUT SECTION                             │   │
│  │  Max Width: 1152px (6xl) | Margin: 0 auto 32px            │   │
│  │  Padding X: 16px                                           │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  YSP CARD                                            │  │   │
│  │  │  Background: rgba(255,255,255,0.9)                   │  │   │
│  │  │  Border Radius: 16px                                 │  │   │
│  │  │  Padding: 24px                                       │  │   │
│  │  │  Shadow: 0 8px 16px rgba(0,0,0,0.1)                 │  │   │
│  │  │  Border: 1px solid rgba(246,66,31,0.1)              │  │   │
│  │  │  ┌────────────────────────────────────────────────┐  │  │   │
│  │  │  │  H2: "About Us"                                │  │  │   │
│  │  │  │  Size: 24px | Font: Lexend Bold               │  │  │   │
│  │  │  │  Color: #f6421f | Margin Bottom: 16px         │  │  │   │
│  │  │  ├────────────────────────────────────────────────┤  │  │   │
│  │  │  │  Paragraph Text                                │  │  │   │
│  │  │  │  Size: 16px | Font: Roboto Regular            │  │  │   │
│  │  │  │  Color: Gray 700/300                           │  │  │   │
│  │  │  │  Text Align: Justify                           │  │  │   │
│  │  │  │  Line Height: 1.625 (relaxed)                  │  │  │   │
│  │  │  └────────────────────────────────────────────────┘  │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   MISSION SECTION                           │   │
│  │  (Same structure as About Section)                         │   │
│  │  Max Width: 1152px | Margin: 0 auto 32px                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   VISION SECTION                            │   │
│  │  (Same structure as About Section)                         │   │
│  │  Max Width: 1152px | Margin: 0 auto 32px                   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   PROJECTS SECTION                          │   │
│  │  Max Width: 1152px | Margin: 0 auto 32px                   │   │
│  │  Padding X: 16px                                           │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  YSP CARD                                            │  │   │
│  │  │  ┌────────────────────────────────────────────────┐  │  │   │
│  │  │  │  H2: "Our Projects" (Same as About)           │  │  │   │
│  │  │  ├────────────────────────────────────────────────┤  │  │   │
│  │  │  │  ADMIN CONTROLS (if authorized)                │  │  │   │
│  │  │  │  Flex Row | Gap: 12px | Margin Bottom: 24px   │  │  │   │
│  │  │  │  - Upload Button: Blue gradient               │  │  │   │
│  │  │  │  - Delete Button: Red gradient                │  │  │   │
│  │  │  │  Height: 36px | Padding: 8px 16px             │  │  │   │
│  │  │  ├────────────────────────────────────────────────┤  │  │   │
│  │  │  │  PROJECTS GRID                                 │  │  │   │
│  │  │  │  Grid:                                         │  │  │   │
│  │  │  │  - Mobile: 1 column                            │  │  │   │
│  │  │  │  - Tablet (768px+): 2 columns                  │  │  │   │
│  │  │  │  - Desktop (1024px+): 3 columns                │  │  │   │
│  │  │  │  Gap: 24px                                     │  │  │   │
│  │  │  │  ┌────────────────────────────────────────┐   │  │  │   │
│  │  │  │  │  PROJECT CARD                          │   │  │  │   │
│  │  │  │  │  Background: White/Dark                │   │  │  │   │
│  │  │  │  │  Border Radius: 16px                   │   │  │  │   │
│  │  │  │  │  Padding: 0 (image full bleed)         │   │  │  │   │
│  │  │  │  │  Shadow: Same as YSP card              │   │  │  │   │
│  │  │  │  │  Cursor: Pointer                       │   │  │  │   │
│  │  │  │  │  Hover: Scale 1.03                     │   │  │  │   │
│  │  │  │  │  ┌──────────────────────────────────┐  │   │  │  │   │
│  │  │  │  │  │  Image                           │  │   │  │  │   │
│  │  │  │  │  │  Width: 100%                     │  │   │  │  │   │
│  │  │  │  │  │  Height: 192px (fixed)           │  │   │  │  │   │
│  │  │  │  │  │  Object Fit: Cover               │  │   │  │  │   │
│  │  │  │  │  │  Border Radius: 8px (top only)   │  │   │  │  │   │
│  │  │  │  │  │  Margin Bottom: 12px             │  │   │  │  │   │
│  │  │  │  │  ├──────────────────────────────────┤  │   │  │  │   │
│  │  │  │  │  │  Title                           │  │   │  │  │   │
│  │  │  │  │  │  Size: 18px | Font: Lexend Bold │  │   │  │  │   │
│  │  │  │  │  │  Color: #f6421f                  │  │   │  │  │   │
│  │  │  │  │  │  Margin Bottom: 8px              │  │   │  │  │   │
│  │  │  │  │  │  Padding X: 16px                 │  │   │  │  │   │
│  │  │  │  │  ├──────────────────────────────────┤  │   │  │  │   │
│  │  │  │  │  │  Description                     │  │   │  │  │   │
│  │  │  │  │  │  Size: 14px | Font: Roboto       │  │   │  │  │   │
│  │  │  │  │  │  Color: Gray 600/400             │  │   │  │  │   │
│  │  │  │  │  │  Line Clamp: 3 (ellipsis)        │  │   │  │  │   │
│  │  │  │  │  │  Padding: 0 16px 16px            │  │   │  │  │   │
│  │  │  │  │  └──────────────────────────────────┘  │   │  │  │   │
│  │  │  │  └────────────────────────────────────────┘   │  │  │   │
│  │  │  └────────────────────────────────────────────────┘  │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              ORGANIZATIONAL CHART SECTION                   │   │
│  │  Max Width: 1152px | Margin: 0 auto 32px                   │   │
│  │  Padding X: 16px                                           │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  YSP CARD                                            │  │   │
│  │  │  ┌────────────────────────────────────────────────┐  │  │   │
│  │  │  │  H2: "Organizational Chart"                    │  │  │   │
│  │  │  ├────────────────────────────────────────────────┤  │  │   │
│  │  │  │  ADMIN CONTROLS (same as Projects)             │  │  │   │
│  │  │  ├────────────────────────────────────────────────┤  │  │   │
│  │  │  │  Chart Image                                   │  │  │   │
│  │  │  │  Width: 100%                                   │  │  │   │
│  │  │  │  Height: Auto (maintains aspect ratio)         │  │  │   │
│  │  │  │  Border Radius: 8px                            │  │  │   │
│  │  │  │  Shadow: 0 10px 15px rgba(0,0,0,0.1)          │  │  │   │
│  │  │  │  Cursor: Pointer (opens modal)                 │  │  │   │
│  │  │  │  Hover: Slight opacity reduction (0.9)         │  │  │   │
│  │  │  └────────────────────────────────────────────────┘  │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                   CONTACT SECTION                           │   │
│  │  Max Width: 1152px | Margin: 0 auto 32px                   │   │
│  │  Padding X: 16px | Padding Bottom: 32px                    │   │
│  │  ┌──────────────────────────────────────────────────────┐  │   │
│  │  │  YSP CARD                                            │  │   │
│  │  │  ┌────────────────────────────────────────────────┐  │  │   │
│  │  │  │  H2: "Get in Touch"                            │  │  │   │
│  │  │  ├────────────────────────────────────────────────┤  │  │   │
│  │  │  │  CONTACT GRID                                  │  │  │   │
│  │  │  │  Grid:                                         │  │  │   │
│  │  │  │  - Mobile: 1 column                            │  │  │   │
│  │  │  │  - Tablet (768px+): 2 columns                  │  │  │   │
│  │  │  │  Gap: 24px                                     │  │  │   │
│  │  │  │  ┌────────────────────────────────────────┐   │  │  │   │
│  │  │  │  │  CONTACT CARD (Email - Blue theme)     │   │  │  │   │
│  │  │  │  │  Background: Blue 50 / Blue 900/20     │   │  │  │   │
│  │  │  │  │  Padding: 16px                         │   │  │  │   │
│  │  │  │  │  Border Radius: 8px                    │   │  │  │   │
│  │  │  │  │  Flex Row | Align: Center | Gap: 16px │   │  │  │   │
│  │  │  │  │  ┌──────────────────────────────────┐  │   │  │  │   │
│  │  │  │  │  │  Icon (Mail)                     │  │   │  │  │   │
│  │  │  │  │  │  Size: 24px | Color: Blue 600    │  │   │  │  │   │
│  │  │  │  │  ├──────────────────────────────────┤  │   │  │  │   │
│  │  │  │  │  │  Text Content                    │  │   │  │  │   │
│  │  │  │  │  │  Title: 16px Medium              │  │   │  │  │   │
│  │  │  │  │  │  Value: 14px Regular Gray        │  │   │  │  │   │
│  │  │  │  │  └──────────────────────────────────┘  │   │  │  │   │
│  │  │  │  └────────────────────────────────────────┘   │  │  │   │
│  │  │  │  │  (Repeat for Phone-Green, Location-   │   │  │  │   │
│  │  │  │  │   Orange, Social-Red)                 │   │  │  │   │
│  │  │  └────────────────────────────────────────────────┘  │  │   │
│  │  └──────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

### Detailed Section Measurements

#### 1. Hero Section

**Exact Measurements:**
```
Mobile (< 768px):
  Padding: 48px 16px
  
Desktop (≥ 768px):
  Padding: 80px 24px

Layout: Flex column | Align: center | Text: center
```

**Typography:**
```
H1 Heading:
  Mobile: 30px (1.875rem) | Line Height: 36px (1.2)
  Tablet: 36px (2.25rem) | Line Height: 43px
  Desktop: 48px (3rem) | Line Height: 58px
  Font: Lexend Bold (700)
  Color: #f6421f (YSP Red)
  Letter Spacing: -0.02em (tight)
  Margin Bottom: 16px

Subtitle:
  Mobile: 18px (1.125rem) | Line Height: 27px (1.5)
  Desktop: 20px (1.25rem) | Line Height: 30px (1.5)
  Font: Roboto Regular (400)
  Color Light: #4b5563 (gray-600)
  Color Dark: #9ca3af (gray-400)
  Margin Bottom: 24px
  Max Width: 600px (centered)
```

**Button Group:**
```
Container:
  Display: Flex
  Direction: Row (wraps on small screens)
  Justify: Center
  Gap: 16px
  Margin Top: 24px

Primary Button:
  Width: 140px (mobile) | 160px (desktop)
  Height: 44px
  Padding: 12px 24px
  Background: linear-gradient(135deg, #f6421f 0%, #ee8724 100%)
  Border Radius: 8px
  Font: 16px Medium (500)
  Color: #ffffff
  Shadow: 0 2px 8px rgba(246, 66, 31, 0.2)
  Transition: all 0.25s ease
  Hover: translateY(-2px) + shadow 0 4px 12px rgba(246, 66, 31, 0.3)

Secondary Button:
  Width: 140px (mobile) | 160px (desktop)
  Height: 44px
  Padding: 10px 22px
  Background: transparent
  Border: 2px solid #f6421f
  Border Radius: 8px
  Font: 16px Medium (500)
  Color: #f6421f
  Transition: all 0.25s ease
  Hover: background #f6421f, color white
```

```jsx
<section className="text-center py-12 md:py-20 px-4 md:px-6">
  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-[#f6421f] font-['Lexend'] tracking-tight">
    Welcome to Youth for Service Philippines
  </h1>
  <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto leading-relaxed">
    Empowering youth to serve communities
  </p>
  <div className="flex gap-4 justify-center flex-wrap mt-6">
    <button className="w-36 md:w-40 h-11 px-6 rounded-lg font-medium text-white transition-all duration-250 hover:-translate-y-0.5 hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f6421f 0%, #ee8724 100%)' }}>
      Get Started
    </button>
    <button className="w-36 md:w-40 h-11 px-5 rounded-lg font-medium text-[#f6421f] border-2 border-[#f6421f] bg-transparent transition-all duration-250 hover:bg-[#f6421f] hover:text-white">
      Learn More
    </button>
  </div>
</section>
```

---

#### 2. About/Mission/Vision Sections

**Exact Measurements:**
```
Container:
  Max Width: 1152px (6xl container)
  Margin: 0 auto 32px auto
  Padding X: 16px (mobile) | 24px (desktop)

YSP Card:
  Background Light: rgba(255, 255, 255, 0.9)
  Background Dark: rgba(30, 30, 30, 0.9)
  Border: 1px solid rgba(246, 66, 31, 0.1) (light)
  Border Dark: 1px solid rgba(238, 135, 36, 0.2)
  Border Radius: 16px
  Padding: 24px (mobile) | 32px (desktop)
  Shadow: 0 8px 16px rgba(0, 0, 0, 0.1)
  Shadow Dark: 0 8px 16px rgba(0, 0, 0, 0.3)
  Transition: all 0.3s ease
  Hover: translateY(-2px) + shadow 0 12px 24px rgba(246, 66, 31, 0.15)

Typography:
  H2 Section Title:
    Size: 24px (1.5rem)
    Font: Lexend Bold (700)
    Color: #f6421f
    Margin Bottom: 16px
    Letter Spacing: -0.01em

  Paragraph Text:
    Size: 16px (1rem)
    Font: Roboto Regular (400)
    Color Light: #374151 (gray-700)
    Color Dark: #d1d5db (gray-300)
    Line Height: 1.625 (26px)
    Text Align: Justify
    Letter Spacing: 0.01em
    
  First Letter (optional enhancement):
    Font Size: 56px
    Float: Left
    Line Height: 48px
    Margin: 0 8px 0 0
    Color: #f6421f
```

**Spacing Between Sections:**
```
About → Mission: 32px margin
Mission → Vision: 32px margin
Vision → Projects: 32px margin
```

```jsx
<section className="max-w-6xl mx-auto px-4 md:px-6 mb-8">
  <div className="ysp-card p-6 md:p-8">
    <h2 className="text-2xl font-bold mb-4 text-[#f6421f] font-['Lexend'] tracking-tight">
      About Us
    </h2>
    <p className="text-justify leading-relaxed text-gray-700 dark:text-gray-300 tracking-wide">
      Youth for Service Philippines (YSP) is a dynamic organization committed to 
      empowering young individuals to make meaningful contributions to their communities. 
      Founded on the principles of service, leadership, and social responsibility, 
      YSP provides a platform for youth to engage in various community development 
      initiatives while developing essential life skills.
    </p>
  </div>
</section>

{/* Mission Section - Same structure */}
<section className="max-w-6xl mx-auto px-4 md:px-6 mb-8">
  <div className="ysp-card p-6 md:p-8">
    <h2 className="text-2xl font-bold mb-4 text-[#f6421f] font-['Lexend'] tracking-tight">
      Our Mission
    </h2>
    <p className="text-justify leading-relaxed text-gray-700 dark:text-gray-300 tracking-wide">
      {/* Mission content */}
    </p>
  </div>
</section>

{/* Vision Section - Same structure */}
<section className="max-w-6xl mx-auto px-4 md:px-6 mb-8">
  <div className="ysp-card p-6 md:p-8">
    <h2 className="text-2xl font-bold mb-4 text-[#f6421f] font-['Lexend'] tracking-tight">
      Our Vision
    </h2>
    <p className="text-justify leading-relaxed text-gray-700 dark:text-gray-300 tracking-wide">
      {/* Vision content */}
    </p>
  </div>
</section>
```

---

#### 3. Projects Section

**Exact Measurements:**
```
Container:
  Max Width: 1152px
  Margin: 0 auto 32px
  Padding X: 16px (mobile) | 24px (desktop)

Admin Button Group:
  Display: Flex | Gap: 12px
  Margin Bottom: 24px
  Flex Wrap: Yes (stacks on very small screens)
  
  Upload Button:
    Width: Auto (min 120px)
    Height: 36px
    Padding: 8px 16px
    Background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)
    Border Radius: 8px
    Font: 14px Medium (500)
    Color: #ffffff
    Icon Size: 16px
    Icon-Text Gap: 8px
    Transition: all 0.25s ease
    Hover: Shadow 0 2px 8px rgba(37, 99, 235, 0.3)
  
  Delete Button:
    Width: Auto (min 120px)
    Height: 36px
    Padding: 8px 16px
    Background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)
    Border Radius: 8px
    Font: 14px Medium (500)
    Color: #ffffff
    Icon Size: 16px
    Icon-Text Gap: 8px
    Transition: all 0.25s ease
    Hover: Shadow 0 2px 8px rgba(220, 38, 38, 0.3)

Projects Grid:
  Display: Grid
  Mobile (< 768px): 1 column
  Tablet (768px - 1024px): 2 columns
  Desktop (≥ 1024px): 3 columns
  Gap: 24px (both row and column)
  Auto Rows: 1fr (equal height cards)
```

**Individual Project Card:**
```
Card Container:
  Background: White/Dark (same as YSP card)
  Border Radius: 16px
  Overflow: Hidden
  Shadow: 0 4px 6px rgba(0, 0, 0, 0.1)
  Cursor: Pointer
  Transition: transform 0.25s ease, shadow 0.25s ease
  Hover State:
    Transform: scale(1.03)
    Shadow: 0 8px 12px rgba(0, 0, 0, 0.15)

Image Container:
  Width: 100%
  Height: 192px (fixed)
  Position: Relative
  Overflow: Hidden
  
  Image:
    Width: 100%
    Height: 100%
    Object Fit: Cover
    Object Position: Center
    Transition: transform 0.3s ease
    Hover: scale(1.1)

Content Area:
  Padding: 16px
  
  Title:
    Font: 18px (1.125rem) Lexend Bold
    Color: #f6421f
    Margin Bottom: 8px
    Line Height: 1.4 (25px)
    Max Lines: 2
    Overflow: Ellipsis
    
  Description:
    Font: 14px (0.875rem) Roboto Regular
    Color Light: #4b5563 (gray-600)
    Color Dark: #9ca3af (gray-400)
    Line Height: 1.5 (21px)
    Max Lines: 3 (line-clamp-3)
    Overflow: Ellipsis
    Display: -webkit-box
    -webkit-line-clamp: 3
    -webkit-box-orient: vertical
```

**Empty State (No Projects):**
```
Container:
  Min Height: 200px
  Display: Flex
  Align Items: Center
  Justify Content: Center
  Background: Gray 50 / Gray 800/20
  Border Radius: 12px
  Border: 2px dashed Gray 300 / Gray 600
  
Text:
  Font: 16px Regular
  Color: Gray 500
  Text Align: Center
```

```jsx
<section className="max-w-6xl mx-auto px-4 md:px-6 mb-8">
  <div className="ysp-card p-6 md:p-8">
    <h2 className="text-2xl font-bold mb-6 text-[#f6421f] font-['Lexend']">
      Our Projects
    </h2>
    
    {/* Admin Controls - Only visible to Admin/Auditor */}
    {(isAdmin || isAuditor) && (
      <div className="flex gap-3 mb-6 flex-wrap">
        <button 
          className="flex items-center gap-2 h-9 px-4 rounded-lg font-medium text-sm text-white transition-all duration-250 hover:shadow-md"
          style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
        >
          <Upload className="size-4" />
          Upload Project
        </button>
        <button 
          className="flex items-center gap-2 h-9 px-4 rounded-lg font-medium text-sm text-white transition-all duration-250 hover:shadow-md"
          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}
        >
          <Trash className="size-4" />
          Delete Selected
        </button>
      </div>
    )}
    
    {/* Projects Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
      {projects.map((project, index) => (
        <div 
          key={index}
          className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md cursor-pointer transition-all duration-250 hover:scale-[1.03] hover:shadow-lg"
          onClick={() => openProjectModal(project)}
        >
          {/* Image */}
          <div className="w-full h-48 overflow-hidden relative">
            <OptimizedImage
              src={project.imageUrl}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
          </div>
          
          {/* Content */}
          <div className="p-4">
            <h3 className="font-bold text-lg text-[#f6421f] mb-2 line-clamp-2 font-['Lexend']">
              {project.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed">
              {project.description}
            </p>
          </div>
        </div>
      ))}
    </div>
    
    {/* Empty State */}
    {projects.length === 0 && (
      <div className="min-h-[200px] flex items-center justify-center bg-gray-50 dark:bg-gray-800/20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
        <p className="text-gray-500 text-center">
          No projects available yet.
        </p>
      </div>
    )}
  </div>
</section>
```

---

#### 4. Organizational Chart Section

**Exact Measurements:**
```
Container: (Same as other sections)
  Max Width: 1152px
  Margin: 0 auto 32px
  Padding X: 16px (mobile) | 24px (desktop)

Chart Image Container:
  Width: 100%
  Position: Relative
  Cursor: Pointer
  Border Radius: 12px
  Overflow: Hidden
  
  Image:
    Width: 100%
    Height: Auto (maintains aspect ratio)
    Display: Block
    Border Radius: 8px
    Shadow: 0 10px 15px -3px rgba(0,0,0,0.1)
    Transition: opacity 0.25s ease
    Hover: opacity 0.9
    
  Zoom Indicator (Optional):
    Position: Absolute
    Top: 16px
    Right: 16px
    Background: rgba(0, 0, 0, 0.6)
    Padding: 8px 12px
    Border Radius: 8px
    Color: White
    Font: 14px Medium
    Display: Flex
    Align Items: Center
    Gap: 6px
    Backdrop Filter: blur(4px)
```

**Modal Overlay (Full-Screen View):**
```
Overlay:
  Position: Fixed
  Top: 0
  Left: 0
  Right: 0
  Bottom: 0
  Background: rgba(0, 0, 0, 0.85)
  Z-Index: 1000
  Display: Flex
  Align Items: Center
  Justify Content: Center
  Padding: 20px
  Animation: fadeIn 0.25s ease
  Backdrop Filter: blur(4px)
  
Close Button:
  Position: Absolute
  Top: 16px (mobile) | 24px (desktop)
  Right: 16px (mobile) | 24px (desktop)
  Width: 40px
  Height: 40px
  Background: rgba(255, 255, 255, 0.1)
  Border: 1px solid rgba(255, 255, 255, 0.2)
  Border Radius: 50%
  Display: Flex
  Align Items: Center
  Justify Content: Center
  Cursor: Pointer
  Transition: all 0.2s ease
  Hover: 
    Background rgba(255, 255, 255, 0.2)
    Transform: rotate(90deg)
  
  Icon:
    Size: 24px
    Color: White
    Stroke Width: 2

Modal Image:
  Max Width: 95vw
  Max Height: 90vh (mobile) | 95vh (desktop)
  Width: Auto
  Height: Auto
  Object Fit: Contain
  Border Radius: 8px
  Box Shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5)
  Animation: scaleIn 0.3s ease
  User Select: None
  
Zoom Controls (Optional):
  Position: Absolute
  Bottom: 24px
  Left: 50%
  Transform: translateX(-50%)
  Display: Flex
  Gap: 12px
  Background: rgba(0, 0, 0, 0.6)
  Padding: 12px
  Border Radius: 12px
  Backdrop Filter: blur(8px)
  
  Button:
    Width: 40px
    Height: 40px
    Background: rgba(255, 255, 255, 0.1)
    Border: 1px solid rgba(255, 255, 255, 0.2)
    Border Radius: 8px
    Color: White
    Cursor: Pointer
    Transition: all 0.2s ease
    Hover: Background rgba(255, 255, 255, 0.2)
```

**Empty State (No Chart):**
```
Container:
  Min Height: 300px
  Display: Flex
  Flex Direction: Column
  Align Items: Center
  Justify Content: Center
  Background: Gray 50 / Gray 800/20
  Border: 2px dashed Gray 300 / Gray 600
  Border Radius: 12px
  Padding: 32px
  
Icon:
  Size: 48px
  Color: Gray 400
  Margin Bottom: 12px
  
Text:
  Font: 16px Regular
  Color: Gray 500
  Text Align: Center
```

```jsx
<section className="max-w-6xl mx-auto px-4 md:px-6 mb-8">
  <div className="ysp-card p-6 md:p-8">
    <h2 className="text-2xl font-bold mb-6 text-[#f6421f] font-['Lexend']">
      Organizational Chart
    </h2>
    
    {/* Admin Controls */}
    {(isAdmin || isAuditor) && (
      <div className="flex gap-3 mb-6 flex-wrap">
        <button 
          className="flex items-center gap-2 h-9 px-4 rounded-lg font-medium text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' }}
        >
          <Upload className="size-4" />
          Upload Chart
        </button>
        <button 
          className="flex items-center gap-2 h-9 px-4 rounded-lg font-medium text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' }}
        >
          <Trash className="size-4" />
          Delete Chart
        </button>
      </div>
    )}
    
    {/* Chart Display */}
    {orgChart ? (
      <div 
        className="relative cursor-pointer rounded-xl overflow-hidden group"
        onClick={() => setModalOpen(true)}
      >
        <OptimizedImage
          src={orgChart.imageUrl}
          alt="Organizational Chart"
          className="w-full h-auto rounded-lg shadow-lg transition-opacity duration-250 group-hover:opacity-90"
        />
        
        {/* Zoom Indicator */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="size-4 text-white" />
          <span className="text-sm font-medium text-white">Click to expand</span>
        </div>
      </div>
    ) : (
      <div className="min-h-[300px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8">
        <FileImage className="size-12 text-gray-400 mb-3" />
        <p className="text-gray-500 text-center">
          No organizational chart uploaded yet.
        </p>
      </div>
    )}
  </div>
</section>

{/* Full-Screen Modal */}
{modalOpen && (
  <div 
    className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[1000] flex items-center justify-center p-5 animate-[fadeIn_0.25s_ease]"
    onClick={() => setModalOpen(false)}
  >
    {/* Close Button */}
    <button 
      className="absolute top-4 md:top-6 right-4 md:right-6 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all hover:rotate-90"
      onClick={() => setModalOpen(false)}
    >
      <X className="size-6 text-white" />
    </button>
    
    {/* Modal Image */}
    <img
      src={orgChart.imageUrl}
      alt="Organizational Chart - Full View"
      className="max-w-[95vw] max-h-[90vh] md:max-h-[95vh] w-auto h-auto object-contain rounded-lg shadow-2xl select-none animate-[scaleIn_0.3s_ease]"
      onClick={(e) => e.stopPropagation()}
    />
    
    {/* Optional: Zoom Controls */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 bg-black/60 backdrop-blur-md px-3 py-3 rounded-xl">
      <button className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
        <ZoomIn className="size-5" />
      </button>
      <button className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
        <ZoomOut className="size-5" />
      </button>
      <button className="w-10 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all">
        <Maximize className="size-5" />
      </button>
    </div>
  </div>
)}
```

---

#### 5. Contact Section

**Exact Measurements:**
```
Container:
  Max Width: 1152px
  Margin: 0 auto 32px
  Padding X: 16px (mobile) | 24px (desktop)
  Padding Bottom: 32px (last section)

Contact Grid:
  Display: Grid
  Mobile (< 768px): 1 column
  Tablet/Desktop (≥ 768px): 2 columns
  Gap: 24px (both row and column)
  Auto Rows: 1fr (equal height)
```

**Individual Contact Card:**
```
Card Container:
  Display: Flex
  Flex Direction: Row
  Align Items: Center
  Gap: 16px
  Padding: 16px
  Border Radius: 12px
  Transition: all 0.25s ease
  Cursor: pointer (optional, for clickable cards)
  
  Hover State:
    Transform: translateY(-2px)
    Shadow: 0 4px 12px rgba(0, 0, 0, 0.1)

Email Card (Blue Theme):
  Background Light: #eff6ff (blue-50)
  Background Dark: rgba(30, 64, 175, 0.2) (blue-900/20)
  Border: 1px solid #dbeafe (blue-100) - optional
  
  Icon:
    Size: 24px
    Color: #2563eb (blue-600)
    Flex Shrink: 0
    
  Text Container:
    Flex: 1
    
    Label:
      Font: 16px Medium (500)
      Color Light: #111827 (gray-900)
      Color Dark: #ffffff
      Margin Bottom: 4px
      
    Value:
      Font: 14px Regular (400)
      Color Light: #4b5563 (gray-600)
      Color Dark: #9ca3af (gray-400)
      Word Break: break-all (for long emails)

Phone Card (Green Theme):
  Background Light: #f0fdf4 (green-50)
  Background Dark: rgba(20, 83, 45, 0.2) (green-900/20)
  Border: 1px solid #dcfce7 (green-100) - optional
  Icon Color: #16a34a (green-600)
  Same text structure as Email

Location Card (Orange Theme):
  Background Light: #fff7ed (orange-50)
  Background Dark: rgba(113, 63, 18, 0.2) (yellow-900/20)
  Border: 1px solid #ffedd5 (orange-100) - optional
  Icon Color: #ea580c (orange-600)
  Same text structure as Email

Social Card (Red Theme):
  Background Light: #fef2f2 (red-50)
  Background Dark: rgba(127, 29, 29, 0.2) (red-900/20)
  Border: 1px solid #fee2e2 (red-100) - optional
  Icon Color: #dc2626 (red-600)
  Same text structure as Email
```

**Mobile Stacking:**
```
< 768px:
  - Cards stack vertically
  - Each card full width
  - Order: Email → Phone → Location → Social
  - Minimum touch target: 48px height
  - Increased padding for easier tapping: 20px
```

**Interactive Enhancement (Optional):**
```
Clickable Cards:
  - Email: Opens mailto: link
  - Phone: Opens tel: link
  - Location: Opens maps link
  - Social: Opens social media profile
  
  Active State:
    Transform: scale(0.98)
    Transition: 0.1s
```

```jsx
<section className="max-w-6xl mx-auto px-4 md:px-6 mb-8 pb-8">
  <div className="ysp-card p-6 md:p-8">
    <h2 className="text-2xl font-bold mb-6 text-[#f6421f] font-['Lexend']">
      Get in Touch
    </h2>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr">
      {/* Email Card */}
      <a 
        href="mailto:contact@ysp.org"
        className="flex items-center gap-4 p-4 md:p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98]"
      >
        <div className="shrink-0">
          <Mail className="size-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base text-gray-900 dark:text-white mb-1">
            Email
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 break-all">
            contact@ysp.org
          </p>
        </div>
      </a>
      
      {/* Phone Card */}
      <a 
        href="tel:+639XXXXXXXXX"
        className="flex items-center gap-4 p-4 md:p-5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98]"
      >
        <div className="shrink-0">
          <Phone className="size-6 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base text-gray-900 dark:text-white mb-1">
            Phone
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            +63 XXX XXX XXXX
          </p>
        </div>
      </a>
      
      {/* Location Card */}
      <a 
        href="https://maps.google.com/?q=Manila,Philippines"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-4 md:p-5 bg-orange-50 dark:bg-yellow-900/20 border border-orange-100 dark:border-yellow-800 rounded-xl transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98]"
      >
        <div className="shrink-0">
          <MapPin className="size-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base text-gray-900 dark:text-white mb-1">
            Location
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manila, Philippines
          </p>
        </div>
      </a>
      
      {/* Social Card */}
      <a 
        href="https://facebook.com/YSPOfficial"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-4 p-4 md:p-5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl transition-all duration-250 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.98]"
      >
        <div className="shrink-0">
          <Globe className="size-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-base text-gray-900 dark:text-white mb-1">
            Social Media
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @YSPOfficial
          </p>
        </div>
      </a>
    </div>
  </div>
</section>
```

---

#### 6. Developer Info Section

**Exact Measurements:**
```
Container:
  Max Width: 1152px
  Margin: 0 auto 32px
  Padding X: 16px (mobile) | 24px (desktop)
  Padding Bottom: 32px (final section before footer)

Developer Card:
  Background: Gradient from gray-50 to blue-50
  Background Dark: Gradient from gray-800 to gray-700
  Border: 2px solid
  Border Color Light: #dbeafe (blue-200)
  Border Color Dark: #1e40af (blue-800)
  Border Radius: 16px
  Padding: 24px (mobile) | 32px (desktop)
  Box Shadow: 0 4px 6px -1px rgba(0,0,0,0.1)
```

**Typography & Content:**
```
Heading (H3):
  Text: "Developer Info"
  Font: 18px Lexend Medium (500)
  Color Light: #f6421f (YSP Red)
  Color Dark: #ee8724 (YSP Orange)
  Margin Bottom: 16px
  
Developer Name:
  Font: 18px Roboto Semibold (600)
  Color Light: #111827 (gray-900)
  Color Dark: #ffffff
  Margin Bottom: 8px
  
Role/Position:
  Font: 16px Roboto Regular (400)
  Text: "Membership and Internal Affairs Officer"
  Color Light: #374151 (gray-700)
  Color Dark: #d1d5db (gray-300)
  Margin Bottom: 4px
  
Organization:
  Font: 16px Roboto Regular (400)
  Text: "Youth Service Philippines - Tagum Chapter"
  Color Light: #374151 (gray-700)
  Color Dark: #d1d5db (gray-300)
  Margin Bottom: 16px

Divider:
  Margin Top: 16px
  Padding Top: 16px
  Border Top: 1px solid
  Border Color Light: #d1d5db (gray-300)
  Border Color Dark: #4b5563 (gray-600)

Support Text:
  Font: 14px Roboto Regular (400)
  Color Light: #4b5563 (gray-600)
  Color Dark: #9ca3af (gray-400)
  Line Height: 1.625 (relaxed)
  Text Align: Justify
  
Links:
  Facebook Link:
    Color: #2563eb (blue-600)
    Color Dark: #60a5fa (blue-400)
    Font Weight: Medium (500)
    Hover: Underline
    Target: _blank
    
  Email Link:
    Text: "YSPTagumChapter@gmail.com"
    URL: https://mail.google.com/mail/?view=cm&fs=1&to=YSPTagumChapter@gmail.com
    Color: #f6421f (YSP Red)
    Color Dark: #ee8724 (YSP Orange)
    Font Weight: Medium (500)
    Hover: Underline
    Target: _blank
```

**Support Message:**
```
"Should you encounter any issues, errors, or technical difficulties 
while using this Web App, please do not hesitate to reach out to us. 
You may contact our support team through our official Facebook Page 
or send us an Email: YSPTagumChapter@gmail.com for further assistance. 
We value your feedback and will address your concerns as promptly as 
possible to ensure a smooth user experience."
```

**Mobile Considerations:**
```
< 768px:
  - Reduced padding: 24px
  - Ensure links are easily tappable
  - Text remains justified for professionalism
  - Email link may break on mobile for readability
  
≥ 768px:
  - Full padding: 32px
  - More spacious layout
  - Links inline with text flow
```

```jsx
<section className="max-w-6xl mx-auto px-4 md:px-6 mb-8 pb-8">
  <div className="ysp-card bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 border-2 border-blue-200 dark:border-blue-800">
    <h3 className="text-[#f6421f] dark:text-[#ee8724] mb-4 text-lg font-medium font-['Lexend']">
      Developer Info
    </h3>
    
    <div className="space-y-2">
      <p className="font-semibold text-lg text-gray-900 dark:text-white">
        Ezequiel John B. Crisostomo
      </p>
      <p className="text-gray-700 dark:text-gray-300">
        Membership and Internal Affairs Officer
      </p>
      <p className="text-gray-700 dark:text-gray-300">
        Youth Service Philippines - Tagum Chapter
      </p>
      
      <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
        <p className="text-sm text-gray-600 dark:text-gray-400 text-justify leading-relaxed">
          Should you encounter any issues, errors, or technical difficulties 
          while using this Web App, please do not hesitate to reach out to us. 
          You may contact our support team through our official{' '}
          <a 
            href="https://www.facebook.com/YSPTagumChapter"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Facebook Page
          </a>
          {' '}or send us an Email:{' '}
          <a 
            href="https://mail.google.com/mail/?view=cm&fs=1&to=YSPTagumChapter@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#f6421f] dark:text-[#ee8724] hover:underline font-medium"
          >
            YSPTagumChapter@gmail.com
          </a>
          {' '}for further assistance. We value your feedback and will address 
          your concerns as promptly as possible to ensure a smooth user experience.
        </p>
      </div>
    </div>
  </div>
</section>
```

---

### Responsive Behavior

**Mobile (< 768px):**
- Single column layouts
- Reduced padding (px-4 instead of px-6)
- Smaller text sizes (text-3xl instead of text-5xl)
- Stacked buttons
- Projects: 1 column grid
- Contact cards: 1 column grid

**Tablet (768px - 1024px):**
- 2 column grids for projects
- 2 column grid for contact cards
- Larger text sizes
- More spacing

**Desktop (1024px+):**
- 3 column grid for projects
- Full-width layouts up to max-w-6xl (1152px)
- Largest text sizes
- Maximum spacing

---

### Component Patterns

#### Image Optimization (Google Drive URLs)
```jsx
// Uses OptimizedImage component for Google Drive links
<OptimizedImage
  src="https://drive.google.com/file/d/FILE_ID/view"
  alt="Project name"
  className="w-full h-48 object-cover rounded-lg"
/>

// Automatically converts to direct image URL:
// https://drive.google.com/thumbnail?id=FILE_ID&sz=w1000
```

#### Modal Pattern
```jsx
{/* Overlay */}
{isModalOpen && (
  <div 
    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-5"
    onClick={closeModal}
  >
    {/* Content */}
    <div onClick={(e) => e.stopPropagation()}>
      <img src={modalImage} className="max-w-full max-h-[95vh] object-contain rounded-lg" />
    </div>
    
    {/* Close button */}
    <button className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2">
      <X className="size-6 text-white" />
    </button>
  </div>
)}
```

#### File Upload Pattern (Admin)
```jsx
<input
  type="file"
  ref={fileInputRef}
  onChange={handleFileUpload}
  accept="image/*"
  className="hidden"
/>

<button 
  onClick={() => fileInputRef.current?.click()}
  style={{
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    // ... other styles
  }}
>
  <Upload className="size-4" />
  Upload
</button>
```

---

---

## 🎭 Branding & Assets

### Organization Information

```
Full Name: Youth for Service Philippines
Abbreviation: YSP
Tagline: "Empowering Youth to Serve Communities"

Established: [Year to be confirmed]
Location: Manila, Philippines
Type: Youth Organization / Non-Profit

Mission Statement:
"To empower young individuals to make meaningful contributions 
to their communities through service, leadership, and social responsibility."

Vision Statement:
"A future where every young Filipino is equipped with the skills, 
values, and opportunities to create positive change in society."
```

### Logo Specifications

```
Primary Logo:
  URL: https://i.imgur.com/J4wddTW.png
  Format: PNG (hosted on Imgur)
  Fallback: https://ui-avatars.com/api/?name=YSP&size=80&background=f6421f&color=fff
  
  Current Dimensions:
    Desktop/Mobile Header: 40px × 40px (w-10 h-10)
    Object Fit: contain
    Aspect Ratio: 1:1 (square)
    
  Implementation:
    <img 
      src="https://i.imgur.com/J4wddTW.png" 
      alt="YSP Logo" 
      className="w-10 h-10 object-contain"
      onError={(e) => {
        e.currentTarget.src = "https://ui-avatars.com/api/?name=YSP&size=80&background=f6421f&color=fff";
      }}
    />
    
  Spacing:
    Minimum Clear Space: Logo height × 0.25 (10px minimum)
    Header Padding: 16px (gap-4 from hamburger menu)
    Never place closer than 10px to edges
    
  Colors:
    Full Color: Use on white/light backgrounds
    White Version: Use on dark/colored backgrounds
    Monochrome: Use when color unavailable
    
  Usage Rules:
    - Do not stretch or distort
    - Do not rotate
    - Always use object-contain for proper scaling
    - Maintain aspect ratio always
    - Do not place on busy backgrounds
    - Always provide alt text: "YSP Logo"
    - Always include error fallback handler
```

### Brand Mark / Icon

```
Icon Specifications:
  Primary Logo URL: https://i.imgur.com/J4wddTW.png
  
  Fallback Icon (Generated):
    URL: https://ui-avatars.com/api/?name=YSP&size=80&background=f6421f&color=fff
    Parameters:
      - name=YSP (displays "YSP" text)
      - size=80 (80x80 pixels)
      - background=f6421f (YSP Red background)
      - color=fff (white text)
    
  Recommended Sizes for PWA:
    - 512x512px (app icon, PWA manifest)
    - 192x192px (PWA manifest)
    - 180x180px (iOS home screen - Apple Touch Icon)
    - 32x32px (favicon)
    - 16x16px (browser tab)
    
  Export Formats:
    - PNG with transparency (current format)
    - SVG (recommended for scalability)
    - ICO (for favicon.ico)
    - Apple Touch Icon (180x180 PNG)
    
  Background:
    - Transparent for overlays (if PNG supports it)
    - White for dark mode contexts
    - Gradient (YSP Red to Orange) for splash screens
    
  Current Implementation:
    - Hosted on Imgur CDN
    - 40x40px display size in header
    - Object-contain for proper scaling
    - Error fallback to UI Avatars API
```

### Color Usage Guidelines

```
Primary Color (#f6421f - YSP Red):
  Use For:
    - Primary CTAs and buttons
    - Headings and titles
    - Active states
    - Links (hover state)
    - Icons (primary actions)
    - Brand emphasis
    
  Do Not Use For:
    - Large background areas
    - Body text
    - Borders (too prominent)

Secondary Color (#ee8724 - YSP Orange):
  Use For:
    - Gradients (with primary)
    - Secondary CTAs
    - Hover states
    - Accent elements
    - Success indicators (alternative to green)
    
Accent Color (#fbcb29 - YSP Yellow):
  Use For:
    - Highlights
    - Warning indicators
    - Featured badges
    - Gradient endpoints
    - Attention-grabbing elements

Color Combinations:
  ✅ Approved:
    - Red + Orange gradient
    - Red + Orange + Yellow gradient
    - Red text on white background
    - White text on Red background
    - Gray text for body content
    
  ❌ Avoid:
    - Red on Orange (poor contrast)
    - Yellow text on white (accessibility fail)
    - Red + Green together (color blind issues)
    - Pure black text (use dark gray instead)
```

### Typography Guidelines

```
Font Families:

Lexend (Headings):
  Purpose: Display, headings, titles, CTAs
  Weights Available: 400, 500, 600, 700
  Recommended Weights: 500 (medium), 700 (bold)
  Character Set: Latin, Latin Extended
  License: Open Font License (SIL)
  Loading: Google Fonts CDN
  Fallback: system-ui, sans-serif
  
  Google Fonts URL (Direct Link):
    https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap
  
  CSS Implementation:
    font-family: 'Lexend', system-ui, -apple-system, sans-serif;
  
  Tailwind CSS:
    font-['Lexend']
  
  Best Practices:
    - Use for H1-H6 elements
    - Use for navigation items
    - Use for button labels
    - Never use for body text
    - Letter spacing: -0.02em for large sizes

Roboto (Body):
  Purpose: Body text, descriptions, UI text
  Weights Available: 300, 400, 500, 700
  Recommended Weights: 400 (regular), 500 (medium)
  Character Set: Latin, Latin Extended, Cyrillic
  License: Apache License 2.0
  Loading: Google Fonts CDN
  Fallback: system-ui, sans-serif
  
  Google Fonts URL (Direct Link):
    https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap
  
  Combined URL (Both Fonts - RECOMMENDED):
    https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Lexend:wght@400;500;600;700&display=swap
  
  CSS Implementation:
    font-family: 'Roboto', system-ui, -apple-system, sans-serif;
  
  Tailwind CSS:
    Default body font (no class needed, or font-sans)
  
  Best Practices:
    - Use for all paragraph text
    - Use for form inputs
    - Use for tables and lists
    - Line height: 1.5 minimum
    - Letter spacing: 0.01em for readability

Font Loading Strategy:
  Method: Preconnect + stylesheet link
  Display: swap (prevent FOIT - Flash of Invisible Text)
  Preload: Critical fonts for above-the-fold content
  Fallback: System fonts while loading
  
  HTML Implementation:
    <!-- Add to <head> section -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Lexend:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

---

## � Team & Credits

### Development Team

```
Frontend Development:
  Framework: React 18 + TypeScript
  Build Tool: Vite 6
  UI Library: shadcn/ui + Tailwind CSS
  Animation: Framer Motion
  State Management: React Hooks + Context
  
Backend/API:
  Platform: Google Apps Script
  Database: Google Sheets
  Authentication: Custom JWT-based
  Storage: Google Drive (for images)
  
Deployment:
  Platform: Vercel
  Domain: [To be configured]
  SSL: Automatic (Vercel)
  CDN: Vercel Edge Network
  
Version Control:
  Repository: GitHub (ysp-webapp)
  Owner: zekeejbc-lgtm
  Branch: main
  Commit: 7d6c433 (latest)
```

### Technical Specifications

```
Browser Support:
  ✅ Chrome/Edge: Latest 2 versions
  ✅ Firefox: Latest 2 versions
  ✅ Safari: Latest 2 versions (iOS 14+)
  ⚠️ IE11: Not supported
  
Mobile Support:
  ✅ iOS Safari: 14+
  ✅ Chrome Mobile: Latest
  ✅ Samsung Internet: Latest
  
Screen Sizes:
  Mobile: 375px - 767px
  Tablet: 768px - 1023px
  Desktop: 1024px+
  Max Content Width: 1152px (6xl)
  
Performance Targets:
  First Contentful Paint: < 1.5s
  Largest Contentful Paint: < 2.5s
  Time to Interactive: < 3.5s
  Cumulative Layout Shift: < 0.1
  
Accessibility:
  WCAG Level: AA compliant
  Screen Reader: Full support
  Keyboard Navigation: Full support
  Focus Indicators: Always visible
  Color Contrast: 4.5:1 minimum
```

### Dependencies & Libraries

```
Core Dependencies:
  - react: ^18.3.1
  - react-dom: ^18.3.1
  - typescript: ^5.6.3
  - vite: ^6.0.11
  
UI Components:
  - @radix-ui/react-*: Various (shadcn/ui foundation)
  - framer-motion: ^11.15.0
  - lucide-react: ^0.462.0
  - sonner: ^1.7.3 (toast notifications)
  
Styling:
  - tailwindcss: ^3.4.17
  - autoprefixer: ^10.4.20
  - postcss: ^8.4.49
  
Build Tools:
  - vite-plugin-compression: ^0.5.1
  - vite-plugin-pwa: ^0.21.4
  - rollup-plugin-visualizer: ^5.12.0
  
Development:
  - @vitejs/plugin-react: ^4.3.4
  - @types/react: ^18.3.18
  - eslint: ^9.17.0
```

### Developer Information

```
Lead Developer:
  Name: Ezequiel John B. Crisostomo
  Role: Membership and Internal Affairs Officer
  Organization: Youth Service Philippines - Tagum Chapter
  
  Contact Methods:
    Email: YSPTagumChapter@gmail.com
    Facebook: YSP Tagum Chapter Official Page
    Response Time: As promptly as possible
    
  Support Scope:
    - Technical issues and errors
    - Bug reports and troubleshooting
    - Feature requests and feedback
    - User experience improvements
    
  Preferred Contact:
    1. Facebook Page (fastest response)
    2. Email (for detailed reports)
    3. GitHub Issues (for developers)
```

### Contact Information

```
Organization Contact:
  Email: YSPTagumChapter@gmail.com
  Facebook: YSP Tagum Chapter Official Page
  Location: Tagum City, Philippines
  
Technical Support:
  Primary: Facebook Page (fastest)
  Secondary: Email (YSPTagumChapter@gmail.com)
  Response Time: 24-48 hours (usually faster)
  
Bug Reports:
  GitHub Issues: github.com/zekeejbc-lgtm/ysp-webapp/issues
  Priority: Critical → High → Medium → Low
  Email: YSPTagumChapter@gmail.com (with screenshots)
  
Feature Requests:
  Method: Facebook Page or GitHub Discussions
  Review Cycle: Monthly
  Community Input: Encouraged
  
Social Media:
  Facebook: YSP Tagum Chapter Official (Primary)
  Email: YSPTagumChapter@gmail.com
  
Support Policy:
  "Should you encounter any issues, errors, or technical difficulties 
  while using this Web App, please do not hesitate to reach out to us. 
  You may contact our support team through our official Facebook Page 
  or send us an Email for further assistance. We value your feedback 
  and will address your concerns as promptly as possible to ensure a 
  smooth user experience."
```

---

## 🎨 Design Tokens (JSON Format for Figma Plugins)

```json
{
  "colors": {
    "brand": {
      "primary": "#f6421f",
      "secondary": "#ee8724",
      "accent": "#fbcb29"
    },
    "ui": {
      "background": "#ffffff",
      "foreground": "#030213",
      "card": "#ffffff",
      "border": "rgba(0, 0, 0, 0.1)",
      "input": "#f3f3f5",
      "ring": "#717182"
    },
    "semantic": {
      "success": "#10b981",
      "warning": "#f59e0b",
      "error": "#dc2626",
      "info": "#2563eb"
    }
  },
  "typography": {
    "fontFamilies": {
      "heading": "Lexend, sans-serif",
      "body": "Roboto, sans-serif"
    },
    "fontSizes": {
      "xs": "12px",
      "sm": "14px",
      "base": "16px",
      "lg": "18px",
      "xl": "20px",
      "2xl": "24px",
      "3xl": "30px"
    },
    "fontWeights": {
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "lineHeights": {
      "tight": 1.2,
      "normal": 1.5,
      "relaxed": 1.625
    }
  },
  "spacing": {
    "0": "0px",
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "6": "24px",
    "8": "32px",
    "10": "40px",
    "12": "48px",
    "16": "64px",
    "20": "80px"
  },
  "borderRadius": {
    "sm": "6px",
    "md": "8px",
    "lg": "10px",
    "xl": "12px",
    "2xl": "16px",
    "full": "9999px"
  },
  "shadows": {
    "sm": "0 1px 3px 0 rgba(0,0,0,0.1)",
    "md": "0 4px 6px -1px rgba(0,0,0,0.1)",
    "lg": "0 10px 15px -3px rgba(0,0,0,0.1)",
    "xl": "0 20px 25px -5px rgba(0,0,0,0.1)"
  },
  "breakpoints": {
    "mobile": "375px",
    "tablet": "768px",
    "desktop": "1024px",
    "wide": "1280px"
  }
}
```

---

## 📱 PWA & App Configuration

### Progressive Web App Settings

```json
{
  "name": "Youth for Service Philippines",
  "short_name": "YSP",
  "description": "Empowering youth to serve communities through leadership and social responsibility",
  "theme_color": "#f6421f",
  "background_color": "#ffffff",
  "display": "standalone",
  "orientation": "portrait-primary",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["education", "social", "youth"],
  "shortcuts": [
    {
      "name": "My Profile",
      "short_name": "Profile",
      "url": "/profile",
      "icons": []
    },
    {
      "name": "Attendance",
      "short_name": "Attendance",
      "url": "/attendance",
      "icons": []
    }
  ]
}
```

### Meta Tags & SEO

```html
<!-- Primary Meta Tags -->
<title>Youth for Service Philippines | YSP</title>
<meta name="title" content="Youth for Service Philippines | YSP" />
<meta name="description" content="Empowering youth to serve communities through leadership and social responsibility. Join YSP and make a difference." />
<meta name="keywords" content="youth, service, philippines, leadership, community, volunteer, education, social responsibility" />
<meta name="author" content="Youth for Service Philippines" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
<meta name="theme-color" content="#f6421f" />

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://ysp.vercel.app/" />
<meta property="og:title" content="Youth for Service Philippines | YSP" />
<meta property="og:description" content="Empowering youth to serve communities through leadership and social responsibility." />
<meta property="og:image" content="https://ysp.vercel.app/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="en_US" />
<meta property="og:site_name" content="Youth for Service Philippines" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="https://ysp.vercel.app/" />
<meta name="twitter:title" content="Youth for Service Philippines | YSP" />
<meta name="twitter:description" content="Empowering youth to serve communities through leadership and social responsibility." />
<meta name="twitter:image" content="https://ysp.vercel.app/twitter-image.png" />

<!-- Apple -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="YSP" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/ysp-logo.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />

<!-- Manifest -->
<link rel="manifest" href="/manifest.json" />
```

---

## 🔗 CDN & External Resources

### Google Fonts Links

```html
<!-- Preconnect for Performance -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Google Fonts Stylesheet (Combined - Recommended) -->
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Lexend:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

**Direct Font URLs:**
- **Roboto Only**: https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap
- **Lexend Only**: https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700&display=swap
- **Both Fonts (Use This)**: https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Lexend:wght@400;500;600;700&display=swap

### Logo URLs

```
Primary Logo:
  URL: https://i.imgur.com/J4wddTW.png
  CDN: Imgur
  Format: PNG
  Display Size: 40×40px
  
Fallback Logo:
  URL: https://ui-avatars.com/api/?name=YSP&size=80&background=f6421f&color=fff
  Service: UI Avatars API
  Customizable via URL parameters
```

### Icon Library

```
Library: Lucide React
NPM: https://www.npmjs.com/package/lucide-react
Docs: https://lucide.dev/
Install: npm install lucide-react
Version: ^0.462.0

Usage:
  import { Menu, Mail, Sun, Moon } from 'lucide-react';
  <Mail className="size-6 text-blue-600" />
```

### API Endpoints

```
Google Apps Script: https://script.google.com/macros/s/[SCRIPT_ID]/exec
Google Drive Thumbnails: https://drive.google.com/thumbnail?id=[FILE_ID]&sz=w1000
```

### Contact Links

```
Facebook: https://www.facebook.com/YSPTagumChapter
Email: YSPTagumChapter@gmail.com
Gmail Compose: https://mail.google.com/mail/?view=cm&fs=1&to=YSPTagumChapter@gmail.com
```

---

## �📚 Usage Notes

1. **OKLCH Colors**: Modern color space for better perceptual uniformity. If Figma doesn't support OKLCH, use the hex equivalents or convert using tools.

2. **Gradients**: All gradients use 135deg angle for consistency.

3. **Transitions**: Default duration is 0.25s with ease-out timing for most interactions.

4. **Dark Mode**: Apply `.dark` class to parent element to switch color scheme.

5. **Responsive**: Mobile-first approach - styles apply to mobile by default, use breakpoints for larger screens.

6. **Accessibility**: All interactive elements have focus states and respect reduced motion preferences.

7. **Images**: Google Drive images use OptimizedImage component for better loading performance.

8. **Admin Features**: Upload/delete buttons only visible to Admin and Auditor roles.

9. **Fonts**: Load from Google Fonts CDN with font-display: swap for better performance.

10. **Icons**: Using Lucide React library - consistent stroke width (2px), rounded line caps.

---

## 📄 File Structure Reference

```
Project Root:
├── public/
│   ├── ysp-logo.svg (Primary logo)
│   ├── favicon-32x32.png
│   ├── favicon-16x16.png
│   ├── apple-touch-icon.png (180x180)
│   ├── og-image.png (1200x630, for social sharing)
│   ├── twitter-image.png (1200x600)
│   └── icons/
│       ├── icon-192x192.png (PWA)
│       └── icon-512x512.png (PWA)
│
├── src/
│   ├── components/ (All React components)
│   ├── services/ (API integration)
│   ├── styles/ (Global CSS)
│   ├── types/ (TypeScript definitions)
│   └── assets/ (Fonts, images, etc.)
│
├── build/ (Production build output)
└── api/ (Serverless functions)

Asset Locations:
  Logo: /public/ysp-logo.svg
  Favicon: /public/favicon-*.png
  PWA Icons: /public/icons/
  Social Images: /public/og-*.png
  Fonts: Loaded from Google Fonts CDN
  User-Uploaded Images: Google Drive URLs
```

---

**Generated**: October 31, 2025  
**Source**: YSP Web App Production Build  
**Version**: Current (commit 7d6c433)  
**License**: [To be determined by organization]  
**Repository**: github.com/zekeejbc-lgtm/ysp-webapp
