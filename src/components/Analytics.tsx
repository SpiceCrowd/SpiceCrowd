"use client";

import { useEffect } from "react";

export default function Analytics() {
  useEffect(() => {
    try {
      fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ event: 'pageview', props: { path: window.location.pathname } }) });
    } catch {}
  }, []);
  return null;
}
