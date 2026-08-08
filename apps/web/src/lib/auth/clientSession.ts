"use client";

import { ACCOUNT_COOKIE, ACCOUNT_COOKIE_MAX_AGE_SECONDS } from "./constants";

export function setAccountCookie(accountId: string): void {
  document.cookie = `${ACCOUNT_COOKIE}=${accountId}; path=/; max-age=${ACCOUNT_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
}

export function clearAccountCookie(): void {
  document.cookie = `${ACCOUNT_COOKIE}=; path=/; max-age=0`;
}
