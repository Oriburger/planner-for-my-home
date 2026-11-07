import { useRef, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { usePlannerStore } from '@/store/plannerStore';
import { useUIStore } from '@/store/uiStore';
import { Icon, type IconName } from '@/components/ui/Icon';
import { WALLPAPERS, fileToWallpaperDataUrl } from '@/utils/wallpaper';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface SettingsSheetProps {
  open: boolean;
  /** 'more' 는 모바일 더보기 — 앱 설치·차트·상세표·테마·마법사 바로가기를 함께 보여준다 */
  mode: 'wallpaper' | 'more';
  onClose: () => void;
  onOpenWizard: () => void;
  onOpenGoals: () => void;
}

export function SettingsSheet({ open, mode, onClose, onOpenWizard, onOpenGoals }: SettingsSheetProps) {
  const resetAll = usePlannerStore((s) => s.resetAll);
  const loadSample = usePlannerStore((s) => s.loadSample);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const wallpaper = useUIStore((s) => s.wallpaper);
  const setWallpaper = useUIStore((s) => s.setWallpaper);
  const custom = useUIStore((s) => s.customWallpaper);
  const setCustomWallpaper = useUIStore((s) => s.setCustomWallpaper);
  const setView = useUIStore((s) => s.setView);
  const view = useUIStore((s) => s.view);
  const { canInstall, installApp } = usePWAInstall();

  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const dataUrl = await fileToWallpaperDataUrl(file);
      if (!setCustomWallpaper(dataUrl)) {
        setError('사진 용량이 커서 저장하지 못했어요. 더 작은 사진을 선택해 주세요.');
      }
    } catch {
      setError('사진을 불러오지 못했어요.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Sheet open={open} title={mode === 'more' ? '더보기' : '배경화면'} onClose={onClose}>
        {mode === 'more' && (
          <div className="mb-5 space-y-1.5">
            {canInstall && (
              <button
                type="button"
                onClick={async () => {
                  await installApp();
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl border border-brand-300 bg-brand-500/10 px-3 py-3 text-left text-sm font-bold text-brand-700 transition hover:bg-brand-500/20 dark:border-brand-700 dark:bg-brand-400/10 dark:text-brand-300"
              >
                <Icon name="upload" className="h-[18px] w-[18px]" />
                <span className="flex-1">📱 홈 화면에 앱으로 설치</span>
                <span className="rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  안드로이드 설치
                </span>
              </button>
            )}

            <SheetRow
              icon="chart"
              label="자산 · 현금흐름 차트"
              active={view === 'charts'}
              onClick={() => {
                setView('charts');
                onClose();
              }}
            />
            <SheetRow
              icon="table"
              label="연도별 상세표"
              active={view === 'table'}
              onClick={() => {
                setView('table');
                onClose();
              }}
            />
            <SheetRow
              icon="target"
              label="연도별 목표 편집"
              onClick={() => {
                onClose();
                onOpenGoals();
              }}
            />
            <SheetRow
              icon="sparkle"
              label="초기 설정 마법사"
              onClick={() => {
                onClose();
                onOpenWizard();
              }}
            />
            <SheetRow
              icon="copy"
              label="2030 직장인 예시 데이터 불러오기"
              onClick={() => {
                if (window.confirm('현재 데이터를 예시 데이터로 덮어쓸까요?')) {
                  loadSample();
                  onClose();
                }
              }}
            />
            <SheetRow
              icon="reset"
              label="입력값 전체 초기화"
              onClick={() => {
                if (window.confirm('입력값을 모두 초기화하고 처음부터 다시 설정할까요?')) {
                  resetAll();
                  onClose();
                }
              }}
            />
          </div>
        )}

        <p className="eyebrow mb-2">화면 모드</p>
        <div className="segmented mb-5" role="group" aria-label="화면 모드">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={theme === t}
              onClick={() => setTheme(t)}
              className="segmented-item min-h-[2.25rem]"
            >
              <Icon name={t === 'light' ? 'sun' : 'moon'} className="h-4 w-4" />
              {t === 'light' ? '라이트' : '다크'}
            </button>
          ))}
        </div>

        <p className="eyebrow mb-2">배경화면</p>
        <div className="grid grid-cols-3 gap-2.5 min-[400px]:grid-cols-4">
          {WALLPAPERS.map((w) => (
            <Swatch
              key={w.id}
              label={w.label}
              selected={wallpaper === w.id}
              background={w.background(theme)}
              onClick={() => setWallpaper(w.id)}
            />
          ))}

          {custom && (
            <Swatch
              label="내 사진"
              selected={wallpaper === 'custom'}
              background={`url("${custom}") center / cover`}
              onClick={() => setWallpaper('custom')}
            />
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-ink-600 dark:text-slate-400"
          >
            <span className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed border-ink-900/20 transition-colors hover:border-ink-900/40 hover:bg-ink-900/[0.03] dark:border-white/20 dark:hover:border-white/40">
              <Icon name="upload" className="h-[18px] w-[18px]" />
            </span>
            {busy ? '불러오는 중…' : '사진 선택'}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickFile(e.target.files?.[0])}
        />

        {error && <p className="callout-danger mt-3">{error}</p>}

        {custom && (
          <button
            type="button"
            onClick={() => setCustomWallpaper(null)}
            className="mt-3 text-xs font-medium text-ink-600 underline-offset-4 hover:text-ink-900 hover:underline dark:text-slate-400 dark:hover:text-white"
          >
            내 사진 삭제
          </button>
        )}
    </Sheet>
  );
}

function Swatch({
  label,
  selected,
  background,
  onClick,
}: {
  label: string;
  selected: boolean;
  background: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className="flex flex-col items-center gap-1.5 text-[11px] font-medium text-ink-600 dark:text-slate-300"
    >
      <span
        className={`relative flex aspect-[4/3] w-full items-center justify-center rounded-lg ring-offset-2 ring-offset-transparent transition-shadow ${
          selected
            ? 'ring-2 ring-ink-900 dark:ring-white'
            : 'ring-1 ring-ink-900/10 hover:ring-ink-900/25 dark:ring-white/10 dark:hover:ring-white/25'
        }`}
        style={{ background }}
      >
        {selected && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-white shadow dark:bg-white dark:text-ink-900">
            <Icon name="check" className="h-3 w-3" strokeWidth={2.5} />
          </span>
        )}
      </span>
      {label}
    </button>
  );
}

function SheetRow({
  icon,
  label,
  active,
  onClick,
}: {
  icon: IconName;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-tile-interactive flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-ink-800 dark:text-slate-100"
    >
      <Icon name={icon} className="h-[18px] w-[18px] text-ink-600 dark:text-slate-400" />
      <span className="flex-1">{label}</span>
      {active ? (
        <Icon name="check" className="h-4 w-4" />
      ) : (
        <Icon name="chevronRight" className="h-4 w-4 text-ink-500" />
      )}
    </button>
  );
}
