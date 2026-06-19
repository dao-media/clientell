export const THEME_STORAGE_KEY = 'briefly-theme';

export type ThemeSetting = 'system' | 'light' | 'dark';

export type ResolvedTheme = 'light' | 'dark';

export function isThemeSetting(value: string | null): value is ThemeSetting {
	return value === 'system' || value === 'light' || value === 'dark';
}

export function getStoredTheme(): ThemeSetting {
	if (typeof localStorage === 'undefined') return 'system';
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	return isThemeSetting(stored) ? stored : 'system';
}

export function resolveTheme(setting: ThemeSetting): ResolvedTheme {
	if (setting === 'light') return 'light';
	if (setting === 'dark') return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(setting: ThemeSetting): ResolvedTheme {
	const theme = resolveTheme(setting);
	document.documentElement.setAttribute('data-theme', theme);
	return theme;
}

export function cycleTheme(current: ThemeSetting): ThemeSetting {
	if (current === 'system') return 'light';
	if (current === 'light') return 'dark';
	return 'system';
}

export function themeLabel(setting: ThemeSetting, resolved: ResolvedTheme): string {
	if (setting === 'system') {
		return `System (${resolved === 'dark' ? 'dark' : 'light'})`;
	}
	return setting === 'dark' ? 'Dark' : 'Light';
}
