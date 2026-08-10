import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ViewMode = 'auto' | 'pc' | 'mobile';
export type ThemeMode = 'light' | 'dark';

interface UIState {
  viewMode: ViewMode;
  theme: ThemeMode;
  setViewMode: (mode: ViewMode) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      viewMode: 'auto',
      theme: 'light',
      setViewMode: (viewMode) => set({ viewMode }),
      setTheme: (theme) => {
        set({ theme });
        if (typeof document !== 'undefined') {
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(next);
      },
    }),
    {
      name: 'planner-ui-theme:v1',
      onRehydrateStorage: () => (state) => {
        if (state && typeof document !== 'undefined') {
          if (state.theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      },
    },
  ),
);
