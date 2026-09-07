const authPaths = new Set(['/login', '/register', '/forgot-password']);

export function safeReturnUrl(value: string | null): string | null {
  if (!value?.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null;
  const pathname = value.split(/[?#]/)[0].replace(/\/$/, '');
  return authPaths.has(pathname) ? null : value;
}

export function authUrl(path: string, returnUrl: string | null): string {
  const destination = safeReturnUrl(returnUrl);
  return destination ? `${path}?${new URLSearchParams({ returnUrl: destination })}` : path;
}
