/**
 * Dev-only workaround for ngrok-free's "Visit Site" interstitial.
 *
 * When the server is exposed via an ngrok-free tunnel, the first browser-origin
 * fetch to that host is intercepted by ngrok and answered with an HTML warning
 * page (status 200, no CORS headers). Sending any value for the
 * `ngrok-skip-browser-warning` request header bypasses the interstitial, so
 * ngrok forwards the request to the underlying server which then attaches the
 * usual CORS headers.
 *
 * Only patches fetch in development and only injects the header for requests
 * whose target host matches `*.ngrok-free.app` / `*.ngrok-free.dev` / `*.ngrok.io`.
 */
const NGROK_HOST_PATTERN = /\.ngrok(-free)?\.(app|dev|io)$/i;

function isNgrokTarget(input: RequestInfo | URL): boolean {
  try {
    const url =
      typeof input === 'string'
        ? new URL(input, window.location.href)
        : input instanceof URL
          ? input
          : new URL(input.url, window.location.href);
    return NGROK_HOST_PATTERN.test(url.hostname);
  } catch {
    return false;
  }
}

export function installNgrokDevFetchShim(): void {
  if (!import.meta.env.DEV) return;
  if (typeof window === 'undefined' || !window.fetch) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input, init) => {
    if (!isNgrokTarget(input)) return originalFetch(input, init);

    const headers = new Headers(
      init?.headers ?? (input instanceof Request ? input.headers : undefined),
    );
    if (!headers.has('ngrok-skip-browser-warning')) {
      headers.set('ngrok-skip-browser-warning', '1');
    }
    return originalFetch(input, { ...init, headers });
  };
}
