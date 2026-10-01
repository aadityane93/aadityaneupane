const introOverlay = document.getElementById('intro-overlay');
const closeButton = document.getElementById('closeOverlay');
let started = false;
let idleId;
let timeoutId;
let frameId;

async function startApp() {
  if (started) return;
  started = true;
  closeButton?.removeEventListener('click', startApp);
  cancelAnimationFrame(frameId);
  if (idleId !== undefined) window.cancelIdleCallback(idleId);
  clearTimeout(timeoutId);

  try {
    await import('./mount.jsx');
  } catch (error) {
    console.error('Application startup failed', error);
    const retryButton = document.getElementById('retry-loading');
    if (retryButton) {
      retryButton.hidden = false;
      retryButton.addEventListener('click', () => window.location.reload(), { once: true });
    }
  }
}

closeButton?.addEventListener('click', startApp);

// Keep the visible HTML overlay responsive before loading the application.
if (!introOverlay || introOverlay.style.display === 'none') {
  startApp();
} else {
  frameId = requestAnimationFrame(() => {
    if (started) return;
    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(startApp, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(startApp, 300);
    }
  });
}
