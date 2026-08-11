"use client";

import { THEME_COOKIE, THEME_COOKIE_MAX_AGE_SECONDS } from "./constants";

export function setThemeCookie(topic: string): void {
  document.cookie = `${THEME_COOKIE}=${topic}; path=/; max-age=${THEME_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}
