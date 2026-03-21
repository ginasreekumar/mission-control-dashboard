// Mission Control Dashboard Version
// Auto-generated - do not edit manually

export const APP_VERSION = 'v0.3.0';
export const BUILD_DATE = '2026-03-21';
export const BUILD_SHA = 'ddc9e06';
export const BUILD_NUMBER = '2026-03-21-2';

export function getVersionString(): string {
  return `${APP_VERSION} (${BUILD_SHA})`;
}

export function getBuildInfo(): { version: string; date: string; sha: string; number: string } {
  return {
    version: APP_VERSION,
    date: BUILD_DATE,
    sha: BUILD_SHA,
    number: BUILD_NUMBER,
  };
}
