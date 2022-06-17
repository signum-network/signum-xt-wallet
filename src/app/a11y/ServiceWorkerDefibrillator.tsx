import { useEffect, useRef } from 'react';

import browser from 'webextension-polyfill';
function keepSWAlive() {
  return setInterval(async function () {
    try {
      await browser.runtime.sendMessage('wakeup');
    } catch (e) {}
  }, 10_000);
}

const ServiceWorkerDefibrillator = () => {
  const interval = useRef<any>();

  useEffect(() => {
    const manifest = browser.runtime.getManifest();
    if (manifest.manifest_version === 3) {
      interval.current = keepSWAlive();
    }
    return () => {
      clearInterval(interval && interval.current);
    };
  }, []);

  return null;
};

export default ServiceWorkerDefibrillator;
