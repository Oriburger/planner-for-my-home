import { useUIStore } from '@/store/uiStore';
import { wallpaperBackground } from '@/utils/wallpaper';

/** 화면 전체 배경화면 — 유리 패널 뒤에 깔린다 */
export function Wallpaper() {
  const id = useUIStore((s) => s.wallpaper);
  const theme = useUIStore((s) => s.theme);
  const custom = useUIStore((s) => s.customWallpaper);
  const isPhoto = id === 'custom' && !!custom;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div
        key={`${id}-${theme}`}
        className="animate-fade-in absolute inset-0"
        style={{ background: wallpaperBackground(id, theme, custom) }}
      />
      {/* 사진 위에서도 글자가 읽히도록 살짝 눌러준다 */}
      {isPhoto && <div className="absolute inset-0 bg-white/10 dark:bg-black/35" />}
    </div>
  );
}
