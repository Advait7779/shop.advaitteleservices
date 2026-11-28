import React, { useEffect, useRef, useState } from 'react';
import {
  DESKTOP_BUILDINGS,
  DESKTOP_PARKS,
  MOBILE_BUILDINGS,
  MOBILE_PARKS,
} from './mapCityData';

const MOBILE_TREES = [
  { cx: 114, cy: 30, r: 9 },
  { cx: 145, cy: 24, r: 10.5 },
  { cx: 186, cy: 35, r: 8 },
  { cx: 92, cy: -6, r: 8.5 },
  { cx: 168, cy: -8, r: 9.5 },
  { cx: 204, cy: 12, r: 7.5 },
  { cx: 362, cy: 535, r: 7.5 },
  { cx: 344, cy: 560, r: 6.5 },
  { cx: 356, cy: 578, r: 7.8 },
  { cx: 346, cy: 618, r: 8.2 },
  { cx: 248, cy: 520, r: 6.4 },
];

const DESKTOP_TREES = [
  { cx: 94, cy: 134, r: 10 },
  { cx: 112, cy: 142, r: 7.5 },
  { cx: 88, cy: 168, r: 8.2 },
  { cx: 166, cy: 128, r: 10 },
  { cx: 182, cy: 138, r: 7 },
  { cx: 136, cy: 112, r: 8.6 },
  { cx: 108, cy: 248, r: 9.5 },
  { cx: 134, cy: 262, r: 7.2 },
  { cx: 176, cy: 256, r: 8 },
  { cx: 198, cy: 272, r: 9 },
  { cx: 228, cy: 304, r: 9.5 },
  { cx: 454, cy: 158, r: 8.5 },
  { cx: 472, cy: 172, r: 7 },
  { cx: 494, cy: 178, r: 9 },
  { cx: 988, cy: 112, r: 9 },
  { cx: 1016, cy: 96, r: 8 },
  { cx: 1055, cy: 112, r: 10 },
  { cx: 1084, cy: 92, r: 8.4 },
  { cx: 1086, cy: 148, r: 8.5 },
  { cx: 1034, cy: 198, r: 10 },
  { cx: 1072, cy: 218, r: 8.5 },
  { cx: 1094, cy: 182, r: 7.6 },
  { cx: 1052, cy: 256, r: 8.2 },
  { cx: 1084, cy: 268, r: 7 },
  { cx: 1278, cy: 306, r: 7.5 },
  { cx: 1288, cy: 326, r: 8 },
  { cx: 1312, cy: 298, r: 9 },
  { cx: 1320, cy: 334, r: 7.2 },
  { cx: 1055, cy: 318, r: 9.5 },
];

/**
 * Shared SVG definitions for clean light-mode vector cartography water gradients,
 * GPS pin shading, pearl-metallic vehicle materials, and soft shadows.
 */
const MapSvgDefs = () => (
  <defs>
    <linearGradient id="advait-map-water" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stopColor="#cde9ec" />
      <stop offset="50%" stopColor="#bce1e6" />
      <stop offset="100%" stopColor="#aed8e0" />
    </linearGradient>

    <linearGradient id="advait-park-pond" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stopColor="#cbe8ec" />
      <stop offset="100%" stopColor="#b9dfe6" />
    </linearGradient>

    <linearGradient id="advait-gps-pin-grad" x1="0.2" y1="0.1" x2="0.85" y2="0.95">
      <stop offset="0%" stopColor="#3ba3e3" />
      <stop offset="55%" stopColor="#2582bf" />
      <stop offset="100%" stopColor="#165a88" />
    </linearGradient>

    <linearGradient id="advait-car-body-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f5f9fc" />
      <stop offset="50%" stopColor="#ffffff" />
      <stop offset="100%" stopColor="#dde7ee" />
    </linearGradient>

    <linearGradient id="advait-car-roof-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#edf3f7" />
      <stop offset="55%" stopColor="#ffffff" />
      <stop offset="100%" stopColor="#dce6ed" />
    </linearGradient>

    <linearGradient id="advait-car-glass-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#0f1f2e" />
      <stop offset="65%" stopColor="#1b344a" />
      <stop offset="100%" stopColor="#2f5778" />
    </linearGradient>

    <linearGradient id="advait-headlight-beam" x1="0" y1="0.5" x2="1" y2="0.5">
      <stop offset="0%" stopColor="#fff8d6" stopOpacity="0.45" />
      <stop offset="55%" stopColor="#fff8d6" stopOpacity="0.14" />
      <stop offset="100%" stopColor="#fff8d6" stopOpacity="0" />
    </linearGradient>

    <filter id="advait-marker-shadow" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="4" stdDeviation="4.5" floodColor="#152f45" floodOpacity="0.28" />
    </filter>

    <filter id="advait-car-shadow" x="-70%" y="-70%" width="240%" height="240%">
      <feDropShadow dx="1.5" dy="4" stdDeviation="3.6" floodColor="#0e2538" floodOpacity="0.30" />
    </filter>
  </defs>
);

/**
 * Clean flat vector trees inside park polygons.
 */
const VectorTrees = ({ trees }) => (
  <g fill="#b5dcbf" opacity="0.86">
    {trees.map(({ cx, cy, r }, i) => (
      <circle key={`vt-${i}`} cx={cx} cy={cy} r={r} />
    ))}
  </g>
);

/**
 * Crisp 2.5D white-layout vector buildings matching clean street map styling.
 */
const VectorBuildings = ({ buildings, prefix }) => (
  <g>
    <g fill="#dbe3e5" transform="translate(1.8 2.2)">
      {buildings.map((d, i) => <path key={`${prefix}-s-${i}`} d={d} />)}
    </g>
    <g fill="#f9fbfb" stroke="#dae3e5" strokeWidth="0.9">
      {buildings.map((d, i) => <path key={`${prefix}-b-${i}`} d={d} />)}
    </g>
  </g>
);

/**
 * Flush white-layout concrete river bridge with open continuous roadway ends,
 * side barrier guardrails, bank abutments, and shadow clipped strictly to river water.
 */
const AerialRiverBridge = ({ p1, p2, roadWidth, riverD, clipId }) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const half = roadWidth / 2;
  const wallH = 2.4;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={riverD} />
        </clipPath>
      </defs>

      {/* Soft cool bridge cast shadow strictly over river water */}
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${p1.x + 3.5} ${p1.y + 5.5}) rotate(${angle})`}>
          <rect
            x="-4"
            y={-(half + wallH)}
            width={len + 8}
            height={roadWidth + wallH * 2}
            fill="#3e6f7d"
            opacity="0.24"
          />
        </g>
      </g>

      {/* Open-ended bridge deck aligned flush with approach road */}
      <g transform={`translate(${p1.x} ${p1.y}) rotate(${angle})`}>
        <rect x="0" y={half + wallH - 0.3} width={len} height="1.3" fill="#aebfc6" opacity="0.7" />
        <rect x="-1.5" y={-half} width={len + 3} height={roadWidth} fill="#ffffff" />

        {[1.5, len * 0.35, len * 0.65, len - 1.5].map((jx, idx) => (
          <line
            key={`joint-${idx}`}
            x1={jx}
            y1={-half}
            x2={jx}
            y2={half}
            stroke="#d4e0e4"
            strokeWidth="0.75"
            opacity="0.75"
          />
        ))}

        <line
          x1="2"
          y1="0"
          x2={len - 2}
          y2="0"
          stroke="#c8d5d9"
          strokeWidth="1.0"
          strokeDasharray="5 5.5"
          opacity="0.8"
        />

        {/* Parallel side concrete parapet walls (open roadway ends) */}
        <rect x="0" y={-(half + wallH)} width={len} height={wallH} fill="#c2d0d6" />
        <rect x="0" y={-(half + wallH - 0.5)} width={len} height="1.0" fill="#e5edf0" />

        <rect x="0" y={half} width={len} height={wallH} fill="#bccbd2" />
        <rect x="0" y={half + 0.5} width={len} height="1.0" fill="#dce6ea" />

        {/* Flared concrete bank abutment piers */}
        <rect x="-2.2" y={-(half + wallH + 0.8)} width="5.0" height={wallH + 0.8} fill="#cfdbe0" stroke="#a6bac2" strokeWidth="0.4" />
        <rect x="-2.2" y={half} width="5.0" height={wallH + 0.8} fill="#c6d4da" stroke="#a6bac2" strokeWidth="0.4" />
        <rect x={len - 2.8} y={-(half + wallH + 0.8)} width="5.0" height={wallH + 0.8} fill="#cfdbe0" stroke="#a6bac2" strokeWidth="0.4" />
        <rect x={len - 2.8} y={half} width="5.0" height={wallH + 0.8} fill="#c6d4da" stroke="#a6bac2" strokeWidth="0.4" />
      </g>
    </g>
  );
};

/**
 * Clean GPS trip start waypoint dot marking where the vehicle departs from.
 */
const RouteStartDot = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" r="10.5" fill="#2582bf" opacity="0.18" />
    <circle cx="0" cy="0" r="5.8" fill="#1e75b3" stroke="#ffffff" strokeWidth="2.5" />
  </g>
);

/**
 * Realistic GPS drop/destination pin with soft ground-level beacon pulses.
 */
const GpsDropPin = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle cx="0" cy="0" r="10" className="map-gps-pulse map-gps-pulse--outer" />
    <circle cx="0" cy="0" r="10" className="map-gps-pulse map-gps-pulse--inner" />
    <circle cx="0" cy="0" r="14" fill="#2582bf" opacity="0.14" />

    <ellipse cx="0" cy="2" rx="9" ry="3.4" fill="#173852" opacity="0.24" />

    <g filter="url(#advait-marker-shadow)">
      <path
        d="M 0 0 C -3.8 -8 -16 -20 -16 -30 C -16 -38.8 -8.8 -46 0 -46 C 8.8 -46 16 -38.8 16 -30 C 16 -20 3.8 -8 0 0 Z"
        fill="url(#advait-gps-pin-grad)"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="-30" r="6.5" fill="#ffffff" />
      <circle cx="0" cy="-30" r="2.8" fill="#1d74b3" />
    </g>
  </g>
);

/**
 * Realistic top-down Pearl-White modern SUV/Sedan oriented along +X,
 * driving along the route towards the GPS drop pin.
 */
const RealisticVehicle = React.forwardRef(({ initialTransform, scale = 1 }, ref) => (
  <g ref={ref} transform={initialTransform}>
    <g transform={`scale(${scale * 0.88})`}>
      <circle cx="0" cy="0" r="15" className="map-car-gps-ring" />
      <circle cx="0" cy="0" r="13.5" fill="#2582bf" opacity="0.14" />

      <polygon points="16,-6.8 48,-15 48,15 16,6.8" fill="url(#advait-headlight-beam)" />

      <g filter="url(#advait-car-shadow)">
        <rect x="-14" y="-10.2" width="6.6" height="2.4" rx="1" fill="#111d28" />
        <rect x="-14" y="7.8" width="6.6" height="2.4" rx="1" fill="#111d28" />
        <rect x="7.4" y="-10.2" width="6.6" height="2.4" rx="1" fill="#111d28" />
        <rect x="7.4" y="7.8" width="6.6" height="2.4" rx="1" fill="#111d28" />

        <path
          d="M -18.5 -6.2 C -18.5 -8.5 -16 -9.4 -11.5 -9.4 L 11.2 -9.4 C 15.6 -9.4 18.6 -7.4 19.2 -3.8 L 19.2 3.8 C 18.6 7.4 15.6 9.4 11.2 9.4 L -11.5 9.4 C -16 9.4 -18.5 8.5 -18.5 6.2 Z"
          fill="url(#advait-car-body-grad)"
          stroke="#1f3b54"
          strokeWidth="1.2"
        />

        <path
          d="M 9.2 -5.8 L 16.8 -4.4 M 9.2 5.8 L 16.8 4.4"
          stroke="#9ab1c4"
          strokeWidth="0.75"
          strokeLinecap="round"
        />

        <path d="M 4.6 -9.4 L 6.4 -11.8 L 8.6 -11.2 L 7.5 -9.4 Z" fill="#ffffff" stroke="#1f3b54" strokeWidth="0.8" />
        <path d="M 4.6 9.4 L 6.4 11.8 L 8.6 11.2 L 7.5 9.4 Z" fill="#ffffff" stroke="#1f3b54" strokeWidth="0.8" />

        <path
          d="M -14 -5.8 C -12.4 -6.9 -8.6 -6.9 -6.8 -6.6 L 6.2 -7.0 C 8.8 -6.8 10.6 -5.5 11.1 -3.6 L 11.1 3.6 C 10.6 5.5 8.8 6.8 6.2 7.0 L -6.8 6.6 C -8.6 6.9 -12.4 6.9 -14 5.8 Z"
          fill="url(#advait-car-glass-grad)"
        />

        <rect
          x="-9.6"
          y="-5.3"
          width="13.0"
          height="10.6"
          rx="2.6"
          fill="url(#advait-car-roof-grad)"
          stroke="#274763"
          strokeWidth="0.7"
        />
        <rect x="-5.4" y="-3.6" width="5.4" height="7.2" rx="1.4" fill="#182f44" opacity="0.78" />

        <path
          d="M 5.8 -5.4 L 9.2 -2.9 M 5.4 -2.8 L 8.8 -0.5"
          stroke="#ffffff"
          strokeWidth="0.95"
          strokeLinecap="round"
          opacity="0.45"
        />

        <path d="M 17.2 -7.4 C 18.4 -6.6 18.9 -5.3 18.9 -3.9" fill="none" stroke="#fff7c2" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M 17.2 7.4 C 18.4 6.6 18.9 5.3 18.9 3.9" fill="none" stroke="#fff7c2" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M -18.1 -7.0 L -18.1 -4.0 M -18.1 4.0 L -18.1 7.0" fill="none" stroke="#ef4444" strokeWidth="1.7" strokeLinecap="round" />
      </g>
    </g>
  </g>
));

/**
 * Calm, realistic 28-second GPS trip cycle:
 *  - [0.00, 0.80] (~22.4s): Smooth steady vehicle drive from start dot to GPS drop pin
 *  - [0.80, 0.94] (~3.9s):  Parked arrival hold right below the GPS drop pin
 *  - [0.94, 1.00] (~1.7s):  Gentle crossfade reset back to start waypoint
 */
function evaluateTripCycle(elapsedMs) {
  const cycleMs = 28000;
  const phase = (elapsedMs % cycleMs) / cycleMs;

  if (phase <= 0.80) {
    const u = phase / 0.80;
    const eased = u < 0.5
      ? 0.5 * Math.pow(2 * u, 1.32)
      : 1 - 0.5 * Math.pow(2 * (1 - u), 1.32);
    const opacity = phase < 0.03 ? phase / 0.03 : 1;
    return { progress: eased * 0.988, opacity };
  }

  if (phase <= 0.94) {
    return { progress: 0.988, opacity: 1 };
  }

  const fadePhase = (phase - 0.94) / 0.06;
  if (fadePhase < 0.5) {
    return { progress: 0.988, opacity: 1 - fadePhase * 2 };
  }
  return { progress: 0, opacity: (fadePhase - 0.5) * 2 };
}

/**
 * Zero-rerender animation driver binding vehicle movement and royal-blue
 * traveled route progress strictly behind the moving vehicle (`0 -> dist`).
 */
function useLiveRouteDriver({ isMobile, routeRef, trailRef, flowMaskRef, carRef }) {
  useEffect(() => {
    const route = routeRef.current;
    const trail = trailRef.current;
    const flowMask = flowMaskRef.current;
    const car = carRef.current;
    if (!route || !trail || !flowMask || !car) return undefined;

    const totalLen = route.getTotalLength();
    if (!totalLen) return undefined;

    const applyFrame = (progress, opacity) => {
      const dist = Math.max(0, Math.min(1, progress)) * totalLen;
      const aheadDist = Math.min(totalLen, dist + 2.5);
      const behindDist = Math.max(0, dist - 2.5);

      const pt = route.getPointAtLength(dist);
      const ptA = route.getPointAtLength(behindDist);
      const ptB = route.getPointAtLength(aheadDist);

      const angle = (Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * 180) / Math.PI;
      car.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) rotate(${angle.toFixed(2)})`);
      car.style.opacity = `${opacity}`;

      const hasDriven = dist >= 1.5;
      trail.style.opacity = hasDriven ? `${opacity}` : '0';
      flowMask.style.strokeDasharray = hasDriven ? `${dist} ${totalLen}` : `0 ${totalLen}`;
    };

    const startOffsetMs = 15200;
    const startTime = performance.now();
    applyFrame(evaluateTripCycle(startOffsetMs).progress, evaluateTripCycle(startOffsetMs).opacity);
    let rafId = 0;

    const tick = (now) => {
      const elapsed = now - startTime + startOffsetMs;
      const { progress, opacity } = evaluateTripCycle(elapsed);
      applyFrame(progress, opacity);
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [isMobile, routeRef, trailRef, flowMaskRef, carRef]);
}

/**
 * Shared GPS route trail strictly masked behind the moving vehicle so un-driven
 * road ahead remains clean white street with zero pre-drawn blue line.
 */
const LiveGpsTrail = ({
  routeD,
  maskId,
  routeRef,
  trailRef,
  flowMaskRef,
  haloWidth,
  coreWidth,
  pulseWidth,
}) => (
  <>
    <defs>
      <mask id={maskId}>
        <path
          ref={flowMaskRef}
          d={routeD}
          fill="none"
          stroke="#ffffff"
          strokeWidth={haloWidth + 4}
          strokeDasharray="0 99999"
          strokeLinecap="butt"
          strokeLinejoin="round"
        />
      </mask>
    </defs>

    <path ref={routeRef} d={routeD} fill="none" stroke="none" />

    <g ref={trailRef} mask={`url(#${maskId})`} style={{ opacity: 0 }}>
      <path d={routeD} fill="none" stroke="#ffffff" strokeWidth={haloWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d={routeD} fill="none" stroke="#1e75b3" strokeWidth={coreWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d={routeD} fill="none" stroke="#9ee0ff" strokeWidth={pulseWidth} strokeLinecap="round" className="map-route-flow" />
    </g>
  </>
);

/* Desktop GPS Route crossing diagonal River Bridge cleanly onto Eastbank Drop Pin (1310, 162) */
const DESKTOP_ROUTE_D =
  'M 218.09 168 ' +
  'L 269.86 316.56 ' +
  'C 278.94 342.62 301.95 367.17 327.37 377.92 ' +
  'C 442.5 426.6 575 458 715 458 ' +
  'C 885 458 960 350 1055 350 ' +
  'A 32 32 0 0 0 1077.23 341.02 ' +
  'L 1239.08 184.72 ' +
  'C 1260.66 163.88 1285 160 1310 162';

/* Mobile GPS Route starting on West Avenue beside "Live" (68, 168) -> Drop Pin (358, 467) */
const MOBILE_ROUTE_D =
  'M 68 168 ' +
  'L 68 495 ' +
  'L 78.25 518.07 ' +
  'C 84.1 531.23 97.6 540 112 540 ' +
  'L 248 542 ' +
  'A 22 22 0 0 0 260.93 537.8 ' +
  'L 358 467';

const TrackingMapHero = () => {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  );

  const routeRef = useRef(null);
  const trailRef = useRef(null);
  const flowMaskRef = useRef(null);
  const carRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = (event) => setIsMobile(event.matches);
    setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useLiveRouteDriver({ isMobile, routeRef, trailRef, flowMaskRef, carRef });

  if (isMobile) {
    const mobileRiverD =
      'M 332 -50 C 312 65 292 185 305 295 C 316 395 288 490 280 665 L 334 665 C 344 490 370 395 358 295 C 345 185 364 65 385 -50 Z';

    return (
      <div className="tracking-hero__map" aria-hidden="true">
        <svg viewBox="-22 -28 474 676" preserveAspectRatio="xMidYMid slice" className="h-full w-full block">
          <MapSvgDefs />
          <rect x="-60" y="-60" width="550" height="740" fill="#eef1f0" />

          {/* Road-sealed parks rendered strictly beneath road casings & river channel */}
          <g fill="#d2ebd7">
            {MOBILE_PARKS.map((d, i) => <path key={`mp-${i}`} d={d} />)}
          </g>

          <VectorTrees trees={MOBILE_TREES} />

          {/* Architectural 2.5D white vector buildings strictly clear of streets, parks & water */}
          <VectorBuildings buildings={MOBILE_BUILDINGS} prefix="m" />

          {/* Winding eastern river channel */}
          <path d={mobileRiverD} fill="url(#advait-map-water)" stroke="#98c7d1" strokeWidth="2" />

          {/* Crisp white street network with subtle cool-gray casings */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 262 66 L 256 222 L 266 434 L 248 498" stroke="#dde6e8" strokeWidth="13" />
            <path d="M 68 152 L 259 146 M 68 224 L 256 222 M 68 298 L 260 292 M 68 372 L 263 366 M 68 442 L 266 434" stroke="#dde6e8" strokeWidth="13" />
            <path d="M 145.74 74.7 L 156 665 M 228 -45 L 232 498 M 248 542 L 248 665 M 386 62 L 375 665" stroke="#dde6e8" strokeWidth="13" />

            <path d="M -50 74 C 120 82 280 66 480 56" stroke="#cbd9de" strokeWidth="20" />

            <path d="M -50 538 L 112 540 M 78 518 L 112 665" stroke="#d2dfe3" strokeWidth="22" />
            <path d="M 68 -45 L 68 495 C 76 518 94 540 112 540 L 248 542" stroke="#cbd9de" strokeWidth="25" />
            <circle cx="248" cy="520" r="22" stroke="#cbd9de" strokeWidth="24" />
            <path d="M 260.93 537.8 L 480 380" stroke="#cbd9de" strokeWidth="25" />

            {/* White roadway surfaces */}
            <path d="M 262 66 L 256 222 L 266 434 L 248 498" stroke="#ffffff" strokeWidth="9.5" />
            <path d="M 68 152 L 259 146 M 68 224 L 256 222 M 68 298 L 260 292 M 68 372 L 263 366 M 68 442 L 266 434" stroke="#ffffff" strokeWidth="9" />
            <path d="M 145.74 74.7 L 156 665 M 228 -45 L 232 498 M 248 542 L 248 665 M 386 62 L 375 665" stroke="#ffffff" strokeWidth="9.5" />

            <path d="M -50 74 C 120 82 280 66 480 56" stroke="#ffffff" strokeWidth="14" />

            <path d="M -50 538 L 112 540 M 78 518 L 112 665" stroke="#ffffff" strokeWidth="17" />
            <path d="M 68 -45 L 68 495 C 76 518 94 540 112 540 L 248 542" stroke="#ffffff" strokeWidth="19" />
            <circle cx="248" cy="520" r="22" stroke="#ffffff" strokeWidth="18" />
            <path d="M 260.93 537.8 L 480 380" stroke="#ffffff" strokeWidth="19" />
          </g>

          <circle cx="248" cy="520" r="10.5" fill="#d2ebd7" stroke="#b3d9bd" strokeWidth="1.5" />

          {/* Clean Concrete River Bridges spanning both riverbanks */}
          <AerialRiverBridge
            p1={{ x: 286.6, y: 519.0 }}
            p2={{ x: 353.0, y: 470.8 }}
            roadWidth={18.8}
            riverD={mobileRiverD}
            clipId="advait-mobile-bridge-water-clip"
          />

          <path d="M 68 -40 L 68 485" fill="none" stroke="#c8d6da" strokeWidth="1.3" strokeDasharray="6 7" />

          {/* Traveled cobalt-blue GPS trail revealed strictly behind moving vehicle */}
          <LiveGpsTrail
            routeD={MOBILE_ROUTE_D}
            maskId="advait-mobile-route-mask"
            routeRef={routeRef}
            trailRef={trailRef}
            flowMaskRef={flowMaskRef}
            haloWidth={11.5}
            coreWidth={6.2}
            pulseWidth={2.2}
          />

          <RouteStartDot x={68} y={168} />
          <RealisticVehicle ref={carRef} initialTransform="translate(260.9 537.8) rotate(-36)" scale={0.90} />
          <GpsDropPin x={358} y={467} scale={0.86} />
        </svg>
      </div>
    );
  }

  const desktopRiverD =
    'M 1207 -50 C 1152 70 1104 158 1108 246 C 1112 326 1155 425 1141 610 L 1223 610 C 1236 425 1192 326 1186 246 C 1180 158 1228 70 1284 -50 Z';

  return (
    <div className="tracking-hero__map" aria-hidden="true">
      <svg viewBox="-72 -28 1584 616" preserveAspectRatio="xMidYMid slice" className="h-full w-full block">
        <MapSvgDefs />

        <rect x="-150" y="-80" width="1740" height="720" fill="#eef1f0" />

        {/* Subtle district land-use zones */}
        <path d="M 320 90 L 980 78 L 1015 410 L 330 390 Z" fill="#eaeff0" opacity="0.7" />
        <path d="M 1220 100 L 1540 120 L 1540 610 L 1220 610 Z" fill="#f1f3f1" opacity="0.65" />

        {/* Road-sealed parks strictly beneath road casings & water */}
        <g fill="#d2ebd7">
          {DESKTOP_PARKS.map((d, i) => <path key={`dp-${i}`} d={d} />)}
        </g>

        <path
          d="M 142 178 C 162 174 182 186 177 204 C 172 220 144 221 134 208 C 127 196 131 182 142 178 Z"
          fill="url(#advait-park-pond)"
          stroke="#9ecad4"
          strokeWidth="1.2"
        />

        <VectorTrees trees={DESKTOP_TREES} />

        {/* Architectural 2.5D white-layout buildings strictly clear of streets, parks & river */}
        <VectorBuildings buildings={DESKTOP_BUILDINGS} prefix="d" />

        {/* Meandering Natural Eastern River Channel */}
        <path d={desktopRiverD} fill="url(#advait-map-water)" stroke="#96c6d0" strokeWidth="2" />

        {/* Complete Multi-Tier White Urban Street Network */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Tier 3: Fine vertical & eastbank streets (casings) */}
          <path d="M 102.65 -45 L 111.36 84.91 M 138.13 297.64 L 171.23 605 M 417.4 -45 L 466.3 605 M 590.2 -45 L 623.5 605 M 766.4 -45 L 796.4 605" stroke="#dde6e8" strokeWidth="11" />
          <path d="M 230.81 206 L 955.83 194 M 276.16 336 L 963.74 330 M 1262.29 355 L 1540 383.8 M 1282 518 L 1540 540.6" stroke="#dde6e8" strokeWidth="11" />

          {/* Tier 2: Connected collector avenues (casings) */}
          <path d="M -90 310.75 L 297.8 398 M -90 450 L 330.6 492 M 44.0 -45 L 117.4 605" stroke="#d6e2e4" strokeWidth="15" />
          <path d="M 321.9 -45 L 378.6 605 M 502.8 -45 L 543.9 605 M 678.5 -45 L 706.3 605 M 853.2 -45 L 886.5 605 M 943.0 -45 L 979.7 605" stroke="#d6e2e4" strokeWidth="13" />
          <path d="M 208.49 142 L 951.87 126 M 253.84 272 L 1023 318 M 345 510 L 1096 500" stroke="#d6e2e4" strokeWidth="13" />
          <path d="M 1032 295 L 951.87 126 M 1074 344 L 1109.0 605" stroke="#d5e1e4" strokeWidth="14" />

          {/* Eastbank Riverfront Collector + avenues (casings) */}
          <path d="M 1286.7 -45 L 1260 165 L 1252 265 L 1268 405 L 1290.9 605" stroke="#d5e1e4" strokeWidth="16" />
          <path d="M 1312.4 -45 L 1360.2 605 M 1390.0 -45 L 1426.7 605" stroke="#d5e1e4" strokeWidth="13" />
          <path d="M 1252 265 L 1540 288 M 1272 444 L 1540 471.8" stroke="#d5e1e4" strokeWidth="14" />

          {/* North Expressway casing */}
          <path d="M -90 80 C 260 96 540 56 820 54 C 1050 52 1230 68 1540 46" stroke="#cbd9de" strokeWidth="25" />

          {/* Primary Arterial Highway & Route Corridor casings */}
          <path d="M 139.8 -55 L 370.0 605" stroke="#cbd9de" strokeWidth="31" />
          <path d="M -90 200.8 L 285 360" stroke="#cedbe0" strokeWidth="27" />
          <path
            d="M 269.86 316.56 C 278.94 342.62 301.95 367.17 327.37 377.92 C 442.5 426.6 575 458 715 458 C 885 458 960 350 1055 350"
            stroke="#cbd9de"
            strokeWidth="31"
          />
          <circle cx="1055" cy="318" r="32" stroke="#cbd9de" strokeWidth="29" />
          <path d="M 1077.23 341.02 L 1239.08 184.72 C 1260.66 163.88 1285 160 1310 162 L 1540 178.2" stroke="#cbd9de" strokeWidth="30" />

          {/* Fine street fills */}
          <path d="M 102.65 -45 L 111.36 84.91 M 138.13 297.64 L 171.23 605 M 417.4 -45 L 466.3 605 M 590.2 -45 L 623.5 605 M 766.4 -45 L 796.4 605" stroke="#ffffff" strokeWidth="7.5" />
          <path d="M 230.81 206 L 955.83 194 M 276.16 336 L 963.74 330 M 1262.29 355 L 1540 383.8 M 1282 518 L 1540 540.6" stroke="#ffffff" strokeWidth="7.5" />

          {/* Secondary collector fills */}
          <path d="M -90 310.75 L 297.8 398 M -90 450 L 330.6 492 M 44.0 -45 L 117.4 605" stroke="#ffffff" strokeWidth="10.5" />
          <path d="M 321.9 -45 L 378.6 605 M 502.8 -45 L 543.9 605 M 678.5 -45 L 706.3 605 M 853.2 -45 L 886.5 605 M 943.0 -45 L 979.7 605" stroke="#ffffff" strokeWidth="9.5" />
          <path d="M 208.49 142 L 951.87 126 M 253.84 272 L 1023 318 M 345 510 L 1096 500" stroke="#ffffff" strokeWidth="9.5" />
          <path d="M 1032 295 L 951.87 126 M 1074 344 L 1109.0 605" stroke="#ffffff" strokeWidth="10" />

          {/* Eastbank collector fills */}
          <path d="M 1286.7 -45 L 1260 165 L 1252 265 L 1268 405 L 1290.9 605" stroke="#ffffff" strokeWidth="11.5" />
          <path d="M 1312.4 -45 L 1360.2 605 M 1390.0 -45 L 1426.7 605" stroke="#ffffff" strokeWidth="9.5" />
          <path d="M 1252 265 L 1540 288 M 1272 444 L 1540 471.8" stroke="#ffffff" strokeWidth="10" />

          {/* North Expressway fill */}
          <path d="M -90 80 C 260 96 540 56 820 54 C 1050 52 1230 68 1540 46" stroke="#ffffff" strokeWidth="18" />

          {/* Primary arterial crisp white fills */}
          <path d="M 139.8 -55 L 370.0 605" stroke="#ffffff" strokeWidth="23" />
          <path d="M -90 200.8 L 285 360" stroke="#ffffff" strokeWidth="20" />
          <path
            d="M 269.86 316.56 C 278.94 342.62 301.95 367.17 327.37 377.92 C 442.5 426.6 575 458 715 458 C 885 458 960 350 1055 350"
            stroke="#ffffff"
            strokeWidth="23"
          />
          <circle cx="1055" cy="318" r="32" stroke="#ffffff" strokeWidth="22" />
          <path d="M 1077.23 341.02 L 1239.08 184.72 C 1260.66 163.88 1285 160 1310 162 L 1540 178.2" stroke="#ffffff" strokeWidth="22.5" />
        </g>

        <path
          d="M -90 80 C 260 96 540 56 820 54 C 1050 52 1230 68 1540 46"
          fill="none"
          stroke="#c8d5d9"
          strokeWidth="1.3"
          strokeDasharray="7 8"
          opacity="0.85"
        />

        {/* Roundabout green center island */}
        <circle cx="1055" cy="318" r="19.5" fill="#d2ebd7" stroke="#b3d8bc" strokeWidth="1.8" />
        <circle cx="1055" cy="318" r="10" fill="#b7ddc2" opacity="0.75" />
        <circle cx="1055" cy="318" r="32" fill="none" stroke="#c7d5da" strokeWidth="1.2" strokeDasharray="5 6" />

        {/* Flush Concrete River Bridge spanning both riverbanks seamlessly */}
        <AerialRiverBridge
          p1={{ x: 1106.0, y: 313.2 }}
          p2={{ x: 1195.9, y: 226.45 }}
          roadWidth={22.2}
          riverD={desktopRiverD}
          clipId="advait-desktop-bridge-water-clip"
        />

        {/* Subtle lane dividers */}
        <g fill="none" stroke="#c8d5d9" strokeWidth="1.4" strokeDasharray="7 8" opacity="0.85">
          <path d="M 143 -45 L 214 156" />
          <path d="M 294 388 L 365 590" />
          <path d="M -75 207.2 L 265 352" />
          <path d="M 1322 163 L 1525 177" />
        </g>

        {/* Crosswalk markings */}
        <g stroke="#d2dde0" strokeWidth="1.6" opacity="0.85">
          <path d="M 264 325 L 276 321 M 266 330 L 278 326 M 268 335 L 280 331" />
          <path d="M 1018 355 L 1024 368 M 1024 352 L 1030 365" />
        </g>

        {/* Traveled cobalt-blue GPS trail revealed strictly behind moving vehicle */}
        <LiveGpsTrail
          routeD={DESKTOP_ROUTE_D}
          maskId="advait-desktop-route-mask"
          routeRef={routeRef}
          trailRef={trailRef}
          flowMaskRef={flowMaskRef}
          haloWidth={12.0}
          coreWidth={6.5}
          pulseWidth={2.4}
        />

        {/* Start waypoint dot -> Live Vehicle driving TO -> Destination GPS Drop Pin */}
        <RouteStartDot x={218.09} y={168} />
        <RealisticVehicle ref={carRef} initialTransform="translate(1152.7 268.1) rotate(-44)" scale={0.96} />
        <GpsDropPin x={1310} y={162} scale={0.92} />
      </svg>
    </div>
  );
};

export default TrackingMapHero;
