export interface AppRelease {
  version: string;
  storeUrl: string;
  nativeUrl: string;
}

function versionParts(value: unknown): number[] | null {
  if (typeof value !== 'string' || !/^\d+(?:\.\d+){0,2}$/.test(value)) return null;
  const parts = value.split('.').map(Number);
  return parts.every(Number.isSafeInteger) ? parts : null;
}

export function isNewerVersion(latest: unknown, installed: unknown): boolean {
  const next = versionParts(latest);
  const current = versionParts(installed);
  if (!next || !current) return false;
  for (let i = 0; i < 3; i++) {
    const difference = (next[i] ?? 0) - (current[i] ?? 0);
    if (difference !== 0) return difference > 0;
  }
  return false;
}

export function getAvailableUpdate(
  payload: unknown,
  platform: string,
  installedVersion: string | null
): AppRelease | null {
  if (platform !== 'ios' && platform !== 'android') return null;
  if (!payload || typeof payload !== 'object') return null;
  const release = (payload as Record<string, unknown>)[platform];
  if (!release || typeof release !== 'object') return null;
  const { version, store_url } = release as Record<string, unknown>;
  if (!isNewerVersion(version, installedVersion) || typeof store_url !== 'string') return null;

  try {
    const url = new URL(store_url);
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;
    let nativeUrl: string;
    if (platform === 'ios') {
      const appId = url.pathname.match(/\/id(\d+)\/?$/)?.[1];
      if (url.hostname !== 'apps.apple.com' || !appId) return null;
      nativeUrl = `itms-apps://apps.apple.com/app/id${appId}`;
    } else {
      const appId = url.searchParams.get('id');
      if (url.hostname !== 'play.google.com' || url.pathname !== '/store/apps/details' || !appId || !/^[\w.]+$/.test(appId)) return null;
      nativeUrl = `market://details?id=${appId}`;
    }
    return { version: version as string, storeUrl: url.toString(), nativeUrl };
  } catch {
    // Incomplete or invalid release settings must never interrupt normal app use.
    return null;
  }
}

export async function openAppStore(release: AppRelease, openUrl: (url: string) => Promise<unknown>): Promise<void> {
  try {
    await openUrl(release.nativeUrl);
  } catch {
    // Devices without a store app (including simulators) can use the web listing.
    await openUrl(release.storeUrl);
  }
}
