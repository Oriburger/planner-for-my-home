export type WallpaperId =
  | 'auto'
  | 'mist'
  | 'graphite'
  | 'dune'
  | 'sage'
  | 'ocean'
  | 'dusk'
  | 'plain'
  | 'custom';

export interface WallpaperPreset {
  id: Exclude<WallpaperId, 'custom'>;
  label: string;
  /** CSS background 값 */
  background: (theme: 'light' | 'dark') => string;
}

const MIST =
  'radial-gradient(80% 60% at 15% 5%, #d5deea 0%, transparent 60%), radial-gradient(70% 60% at 95% 95%, #ddd9e6 0%, transparent 60%), linear-gradient(160deg, #e9edf2 0%, #d8dde5 100%)';
const GRAPHITE =
  'radial-gradient(70% 60% at 15% 0%, #343a46 0%, transparent 60%), radial-gradient(60% 60% at 100% 100%, #262a33 0%, transparent 60%), linear-gradient(160deg, #1a1d24 0%, #0d0f13 100%)';

export const WALLPAPERS: WallpaperPreset[] = [
  {
    id: 'auto',
    label: '자동',
    background: (theme) => (theme === 'dark' ? GRAPHITE : MIST),
  },
  { id: 'mist', label: '미스트', background: () => MIST },
  { id: 'graphite', label: '그래파이트', background: () => GRAPHITE },
  {
    id: 'dune',
    label: '듄',
    background: () =>
      'radial-gradient(80% 60% at 10% 5%, #f4e9da 0%, transparent 60%), radial-gradient(70% 70% at 95% 95%, #dcc4a3 0%, transparent 60%), linear-gradient(160deg, #eee6db 0%, #d6c3aa 100%)',
  },
  {
    id: 'sage',
    label: '세이지',
    background: () =>
      'radial-gradient(70% 60% at 10% 0%, #d3dfd4 0%, transparent 60%), radial-gradient(70% 70% at 100% 100%, #9db3a3 0%, transparent 60%), linear-gradient(160deg, #e1e8e1 0%, #b4c5b8 100%)',
  },
  {
    id: 'ocean',
    label: '오션',
    background: () =>
      'radial-gradient(70% 60% at 10% 0%, #2f5f92 0%, transparent 60%), radial-gradient(70% 70% at 100% 100%, #0e2c4d 0%, transparent 60%), linear-gradient(160deg, #183f69 0%, #0a1d35 100%)',
  },
  {
    id: 'dusk',
    label: '더스크',
    background: () =>
      'radial-gradient(70% 60% at 0% 0%, #5e6bb8 0%, transparent 60%), radial-gradient(70% 70% at 100% 100%, #b07d99 0%, transparent 60%), linear-gradient(160deg, #353a68 0%, #1b1d3a 100%)',
  },
  {
    id: 'plain',
    label: '단색',
    background: (theme) => (theme === 'dark' ? '#0b0d12' : '#e4e7ec'),
  },
];

export function wallpaperBackground(
  id: WallpaperId,
  theme: 'light' | 'dark',
  customDataUrl: string | null,
): string {
  if (id === 'custom' && customDataUrl) {
    return `url("${customDataUrl}") center / cover no-repeat`;
  }
  const preset = WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];
  return preset.background(theme);
}

/* ------------------------------------------------------------------ */
/* 사용자 사진 — localStorage 에 별도 키로 저장 (용량 초과에도 앱이 안전) */
/* ------------------------------------------------------------------ */

const CUSTOM_KEY = 'planner-wallpaper-custom:v1';

export function loadCustomWallpaper(): string | null {
  try {
    return localStorage.getItem(CUSTOM_KEY);
  } catch {
    return null;
  }
}

export function saveCustomWallpaper(dataUrl: string | null): boolean {
  try {
    if (dataUrl) localStorage.setItem(CUSTOM_KEY, dataUrl);
    else localStorage.removeItem(CUSTOM_KEY);
    return true;
  } catch {
    return false;
  }
}

/** 사진을 긴 변 1920px 이하 JPEG 로 줄여 data URL 로 만든다 */
export function fileToWallpaperDataUrl(file: File, maxEdge = 1920): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('canvas unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('이미지를 불러올 수 없습니다.'));
    };
    img.src = url;
  });
}
