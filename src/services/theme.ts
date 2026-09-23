import { ThemeMode } from '../models/types.ts';

const THEME_STORAGE_KEY = 'gg_cal_theme';

export function getStoredTheme(): ThemeMode {
  return (localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode) || 'system';
}

export function isSystemDarkMode(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme?: ThemeMode): void {
  const root = document.documentElement;
  const targetTheme = theme || getStoredTheme();

  if (targetTheme === 'dark') {
    root.classList.add('dark');
  } else if (targetTheme === 'light') {
    root.classList.remove('dark');
  } else {
    if (isSystemDarkMode()) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  updateThemeUI(targetTheme);
}

export function setTheme(theme: ThemeMode, showToastFn?: (msg: string) => void): void {
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
  closeThemeMenu();

  const labels: Record<ThemeMode, string> = {
    light: 'Chế độ Sáng 🌞',
    dark: 'Chế độ Tối 🌙',
    system: 'Theo Hệ Thống 💻'
  };

  if (showToastFn) {
    showToastFn(`Đã chuyển sang ${labels[theme] || theme}`);
  }
}

export function toggleThemeMenu(): void {
  const menu = document.getElementById('theme-dropdown');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

export function closeThemeMenu(): void {
  const menu = document.getElementById('theme-dropdown');
  if (menu) {
    menu.classList.add('hidden');
  }
}

export function updateThemeUI(activeTheme?: ThemeMode): void {
  const current = activeTheme || getStoredTheme();

  const btnIcon = document.getElementById('theme-btn-icon');
  const btnLabel = document.getElementById('theme-btn-label');

  if (btnIcon) {
    if (current === 'dark') {
      btnIcon.className = 'fa-solid fa-moon text-indigo-400';
    } else if (current === 'light') {
      btnIcon.className = 'fa-solid fa-sun text-amber-500';
    } else {
      btnIcon.className = 'fa-solid fa-circle-half-stroke text-indigo-500';
    }
  }

  if (btnLabel) {
    if (current === 'dark') btnLabel.innerText = 'Tối';
    else if (current === 'light') btnLabel.innerText = 'Sáng';
    else btnLabel.innerText = 'Hệ thống';
  }

  (['light', 'dark', 'system'] as ThemeMode[]).forEach((t) => {
    const item = document.getElementById(`theme-opt-${t}`);
    const check = document.getElementById(`theme-check-${t}`);
    if (item && check) {
      if (t === current) {
        item.classList.add('bg-indigo-50', 'dark:bg-indigo-950/60', 'text-indigo-600', 'dark:text-indigo-400', 'font-bold');
        item.classList.remove('text-slate-700', 'dark:text-slate-300');
        check.classList.remove('hidden');
      } else {
        item.classList.remove('bg-indigo-50', 'dark:bg-indigo-950/60', 'text-indigo-600', 'dark:text-indigo-400', 'font-bold');
        item.classList.add('text-slate-700', 'dark:text-slate-300');
        check.classList.add('hidden');
      }
    }
  });
}

export function initTheme(showToastFn?: (msg: string) => void): void {
  applyTheme();

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (getStoredTheme() === 'system') {
        applyTheme('system');
      }
    });
  }

  document.addEventListener('click', (e) => {
    const menu = document.getElementById('theme-dropdown');
    const btn = document.getElementById('btn-theme-menu');
    if (menu && !menu.contains(e.target as Node) && btn && !btn.contains(e.target as Node)) {
      closeThemeMenu();
    }
  });

  (window as any).setTheme = (t: ThemeMode) => setTheme(t, showToastFn);
  (window as any).toggleThemeMenu = toggleThemeMenu;
}
