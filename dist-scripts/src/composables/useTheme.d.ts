/** Options for the theme composable */
export interface ThemeOptions {
    /** Default theme preference */
    defaultTheme?: 'light' | 'dark' | 'system';
    /** Local storage key for remembering preference */
    storageKey?: string;
    /** Whether to track theme changes in analytics */
    trackAnalytics?: boolean;
    /** CSS class to add to HTML element for dark mode */
    darkModeClass?: string;
}
/**
 * Composable for theme management with system preference detection
 * @param options - Configuration options
 * @returns Theme state and control functions
 */
export declare function useTheme(options?: ThemeOptions): {
    isDarkMode: import("vue").Ref<boolean, boolean>;
    preference: import("vue").Ref<"light" | "dark" | "system", "light" | "dark" | "system">;
    setTheme: (theme: "light" | "dark" | "system") => void;
    toggleDarkMode: () => void;
};
