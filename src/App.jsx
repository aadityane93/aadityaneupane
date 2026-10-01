import { lazy, Suspense, useEffect, useState } from 'react';
import './App.css';

const ThreeScene = lazy(() => import('./threejs.jsx'));

function App() {
  const [showScene, setShowScene] = useState(false);

  useEffect(() => {
    let idleId;
    let timeoutId;
    let frameId;
    let started = false;
    const introOverlay = document.getElementById('intro-overlay');
    const closeButton = introOverlay?.querySelector('#closeOverlay');
    const startScene = () => {
      if (started) return;
      started = true;
      setShowScene(true);
    };
    closeButton?.addEventListener('click', startScene);

    // Let the intro iframe paint before importing and building the 3D scene.
    if (introOverlay?.style.display === 'none') {
      startScene();
    } else {
      frameId = requestAnimationFrame(() => {
        if (started) return;
        if ('requestIdleCallback' in window) {
          idleId = window.requestIdleCallback(startScene, { timeout: 1200 });
        } else {
          timeoutId = window.setTimeout(startScene, 300);
        }
      });
    }

    return () => {
      closeButton?.removeEventListener('click', startScene);
      cancelAnimationFrame(frameId);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      clearTimeout(timeoutId);
    };
  }, []);

  return showScene ? (
    <Suspense fallback={null}>
      <ThreeScene />
    </Suspense>
  ) : null;
}

export default App;
