import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import api from '../../services/api';

const storageKey = 'advait_storefront_visit';
const dayMs = 24 * 60 * 60 * 1000;
const format = new Intl.NumberFormat('en-IN');
let currentVisit;

const recent = (visit, now) => typeof visit?.id === 'string' && visit.id.length === 36 &&
  Number.isFinite(visit.startedAt) && visit.startedAt <= now && now - visit.startedAt < dayMs;

function getVisitId() {
  const now = Date.now();
  if (recent(currentVisit, now)) return currentVisit.id;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (recent(saved, now)) {
      currentVisit = saved;
      return saved.id;
    }
  } catch {
    // Count using this page's memory when browser storage is unavailable.
  }

  currentVisit = { id: crypto.randomUUID(), startedAt: now };
  try {
    localStorage.setItem(storageKey, JSON.stringify(currentVisit));
  } catch {
    // The in-memory ID still prevents duplicate requests from counting twice.
  }
  return currentVisit.id;
}

export default function StorefrontViews() {
  const [views, setViews] = useState(null);

  useEffect(() => {
    if (typeof globalThis.crypto?.randomUUID !== 'function') return undefined;
    const controller = new AbortController();
    function recordVisibleVisit() {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', recordVisibleVisit);
      api.post('/storefront/views', { visitId: getVisitId() }, { signal: controller.signal })
        .then(({ data }) => setViews(data))
        .catch(() => {});
    }
    document.addEventListener('visibilitychange', recordVisibleVisit);
    recordVisibleVisit();
    return () => {
      document.removeEventListener('visibilitychange', recordVisibleVisit);
      controller.abort();
    };
  }, []);

  if (!views) return null;

  return (
    <div
      className="inline-flex items-center gap-2 font-semibold text-brand-100"
      title={'Includes a starting count of ' + format.format(views.startingCount)}
    >
      <Eye className="h-4 w-4" aria-hidden="true" />
      <span><span className="tabular-nums">{format.format(views.total)}</span> site views</span>
    </div>
  );
}
