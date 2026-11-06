import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  loadCustomWallpaper,
  saveCustomWallpaper,
  type WallpaperId,
} from '@/utils/wallpaper';

export type ThemeMode = 'light' | 'dark';
export type AppView = 'overview' | 'income' | 'budget' | 'timeline' | 'charts' | 'table';

export const VIEW_LABEL: Record<AppView, string> = {
  overview: '메인',
  income: '수입 관리',
  budget: '계획',
  timeline: '타임라인',
  charts: '차트',
  table: '상세표',
};

interface UIState {
  theme: ThemeMode;
  view: AppView;
  /** 데스크톱에서 좌측 입력 패널 표시 여부 */
  inputPanelOpen: boolean;
  wallpaper: WallpaperId;
  /** 사용자 사진 (localStorage 별도 키에서 복원, persist 대상 아님) */
  customWallpaper: string | null;
  /** 개요·타임라인이 공유하는 선택 연차 (persist 대상 아님) */
  selectedYearIndex: number | null;

  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setView: (view: AppView) => void;
  toggleInputPanel: () => void;
  setWallpaper: (id: WallpaperId) => void;
  setCustomWallpaper: (dataUrl: string | null) => boolean;
  selectYear: (yearIndex: number) => void;
}

function applyThemeClass(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      view: 'overview',
      inputPanelOpen: true,
      wallpaper: 'auto',
      customWallpaper: typeof window !== 'undefined' ? loadCustomWallpaper() : null,
      selectedYearIndex: null,

      setTheme: (theme) => {
        set({ theme });
        applyThemeClass(theme);
      },
      toggleTheme: () => get().setTheme(get().theme === 'light' ? 'dark' : 'light'),
      setView: (view) => {
        // 하위 호환
        const targetView = (view as string) === 'plan' || (view as string) === 'money' ? 'budget' : view;
        set({ view: targetView });
      },
      toggleInputPanel: () => set({ inputPanelOpen: !get().inputPanelOpen }),
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setCustomWallpaper: (dataUrl) => {
        const ok = saveCustomWallpaper(dataUrl);
        if (!ok) return false;
        set({
          customWallpaper: dataUrl,
          wallpaper: dataUrl ? 'custom' : get().wallpaper === 'custom' ? 'auto' : get().wallpaper,
        });
        return true;
      },
      selectYear: (selectedYearIndex) => set({ selectedYearIndex }),
    }),
    {
      name: 'planner-ui-theme:v1',
      version: 2,
      partialize: (s) => ({
        theme: s.theme,
        view: s.view,
        inputPanelOpen: s.inputPanelOpen,
        wallpaper: s.wallpaper,
      }),
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<UIState>;
        let view = p.view ?? 'overview';
        if ((view as string) === 'plan' || (view as string) === 'money') {
          view = 'budget';
        }
        return {
          theme: p.theme === 'dark' ? 'dark' : 'light',
          view,
        } as UIState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) applyThemeClass(state.theme);
      },
    },
  ),
);
