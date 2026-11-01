import { beforeEach } from 'vitest';
import { setAddress } from './address.js';

/**
 * WebKit project only: paces the tests under WebKit's limit of 100 history writes per 10 seconds per page.
 *
 * The suite writes the address several times per test; run back to back it passes the limit within seconds, and a
 * test that presses Back right after a navigation the browser refused (the router writes it again shortly) measures
 * the harness, not the router. Each test starts once the browser takes a write and after a short pause.
 */
beforeEach(async () => {
  await setAddress(history.state, location.href);
  await new Promise((resolve) => setTimeout(resolve, 900));
});
