/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#2563EB"; // primary — buttons, links, focus rings
const tintColorDark = "#8B5CF6"; // primary — dark mode accent (purple)

export const Colors = {
  light: {
    background: "#FFFFFF", // page background
    backgroundSecondary: "#F8FAFC", // subtle section backgrounds
    surface: "#FFFFFF", //  cards, modals
    text: "#0F172A", // main text
    textSecondary: "#64748B", //subtext, labels
    textTertiary: "#94A3B8", //  placeholders, timestamps
    border: "#E2E8F0", // dividers, input borders

    // ---- Brand / Actions ----
    primary: "#2563EB", // primary — blue
    primaryHover: "#1D4ED8", // primary-hover — darker blue on hover
    cta: "#F59E0B", // cta — amber call-to-action accents
    success: "#10B981", // success — confirmations, completed states
    error: "#EF4444", // error — errors, danger actions
    warning: "#F59E0B", // warning — in-progress states

    // ---- Existing app mappings ----
    tint: tintColorLight, // tint maps to primary
    icon: "#64748B", // icon color (uses text-secondary)
    tabIconDefault: "#687076", // inactive tab icons
    tabIconSelected: tintColorLight, // active tab icon
  },

  dark: {
    background: "#13111C", // deep navy page background
    backgroundSecondary: "#1E1B2E", // section backgrounds
    surface: "#282936", //  cards, modals
    text: "#F1F5F9", // main text
    textSecondary: "#94A3B8", // subtext
    textTertiary: "#64748B", // placeholders
    border: "#3B3654", // dividers

    // ---- Brand / Actions ----
    primary: "#8B5CF6", // primary — purple (intentional dark mode identity)
    primaryHover: "#7C3AED", // primary-hover — deeper purple
    cta: "#F59E0B", // cta — amber (consistent across themes)
    success: "#34D399", // success — lighter green for dark contrast
    error: "#F87171", // error — softer red for dark contrast
    warning: "#FBBF24", // warning — lighter amber

    // ---- Existing app mappings ----
    tint: tintColorDark, // tint maps to primary
    icon: "#94A3B8", // icon color (uses text-secondary)
    tabIconDefault: "#9BA1A6", // inactive tab icons
    tabIconSelected: tintColorDark, // active tab icon
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
