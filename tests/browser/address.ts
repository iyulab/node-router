/**
 * Sets the address for a test's setup or cleanup.
 *
 * WebKit refuses more than 100 history writes in 10 seconds per page, and a test file writes the address many times —
 * a refused reset made `beforeEach` throw and every following test in the file fail in a cascade. The reset waits for
 * the browser's window to free instead (Chromium never refuses, so there it is one call).
 */
export async function setAddress(state: unknown, url: string): Promise<void> {
  const deadline = performance.now() + 15000;
  for (;;) {
    try {
      history.replaceState(state, '', url);
      return;
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'SecurityError') || performance.now() > deadline) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}
