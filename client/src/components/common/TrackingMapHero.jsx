import React, { useEffect, useRef, useState } from 'react';
import {
  DESKTOP_BUILDINGS,
  DESKTOP_PARKS,
  MOBILE_BUILDINGS,
  MOBILE_PARKS,
} from './mapCityData';

/**
 * Shared SVG definitions for realistic cartography water gradients, GPS pin shading,
 * pearl-metallic top-down vehicle materials, and architectural shadows.
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
      <stop offset="0%" stopColor="#fff8d6" stopOpacity="0.5" />
      <stop offset="55%" stopColor="#fff8d6" stopOpacity="0.16" />
      <stop offset="100%" stopColor="#fff8d6" stopOpacity="0" />
    </linearGradient>

    <filter id="advait-marker-shadow" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="4" stdDeviation="4.5" floodColor="#152f45" floodOpacity="0.28" />
    </filter>

    <filter id="advait-car-shadow" x="-70%" y="-70%" width="240%" height="240%">
      <feDropShadow dx="1.5" dy="4" stdDeviation="3.6" floodColor="#0e2538" floodOpacity="0.34" />
    </filter>

    <filter id="advait-bridge-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="2" dy="4" stdDeviation="3.5" floodColor="#3e6f7d" floodOpacity="0.24" />
    </filter>
  </defs>
);

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
    <g transform={`scale(${scale * 1.18})`}>
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
    // Stop smoothly just short of pin tip so vehicle nose meets drop point cleanly
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
 * traveled route progress directly to SVG DOM paths.
 */
function useLiveRouteDriver({ isMobile, routeRef, trailRef, flowMaskRef, carRef }) {
  useEffect(() => {
    const route = routeRef.current;
    const trail = trailRef.current;
    const car = carRef.current;
    if (!route || !trail || !car) return undefined;

    const totalLen = route.getTotalLength();
    if (!totalLen) return undefined;

    trail.style.strokeDasharray = `${totalLen}`;

    const applyFrame = (progress, opacity) => {
      const dist = Math.max(0, Math.min(1, progress)) * totalLen;
      const aheadDist = Math.min(totalLen, dist + 2.5);
      const behindDist = Math.max(0, dist - 2.5);

      const pt = route.getPointAtLength(dist);
      const ptA = route.getPointAtLength(behindDist);
      const ptB = route.getPointAtLength(aheadDist);

      const angle = (Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x) * 180) / Math.PI;
      car.setAttribute('transform', `translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) rotate(${angle.toFixed(2)})`);
      car.style.opacity = opacity.toFixed(3);

      trail.style.strokeDashoffset = `${(totalLen - dist).toFixed(2)}`;
      trail.style.opacity = `${Math.max(0.25, opacity).toFixed(3)}`;
      if (flowMaskRef.current) {
        flowMaskRef.current.style.strokeDasharray = `${totalLen}`;
        flowMaskRef.current.style.strokeDashoffset = `${(totalLen - dist).toFixed(2)}`;
      }
    };

    const reducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      applyFrame(0.76, 1);
      return undefined;
    }

    // Start initial frame mid-route climbing around the scenic south-east bend toward the drop pin
    const startOffsetMs = 15200;
    const startTime = performance.now();
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

/* Mobile GPS Route ending at Eastbank Drop Pin (358, 467) */
const MOBILE_ROUTE_D =
  'M 68 495 ' +
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
    return (
      <div className="tracking-hero__map" aria-hidden="true">
        <svg viewBox="0 0 430 620" preserveAspectRatio="xMidYMid slice" className="h-full w-full block">
          <MapSvgDefs />
          <rect width="430" height="620" fill="#eef1f0" />

          {/* Road-sealed parks rendered strictly beneath road casings & river channel */}
          <g fill="#d2ebd7">
            {MOBILE_PARKS.map((d, i) => <path key={`mp-${i}`} d={d} />)}
          </g>
          <g fill="#b7ddc2" opacity="0.82">
            <circle cx="114" cy="30" r="9" /><circle cx="145" cy="24" r="10.5" /><circle cx="186" cy="35" r="8" />
            <circle cx="362" cy="535" r="7" /><circle cx="356" cy="578" r="7.5" />
          </g>

          {/* Architectural 2.5D buildings strictly clear of streets, parks & water */}
          <g fill="#dbe3e5" transform="translate(1.8 2.2)">
            {MOBILE_BUILDINGS.map((d, i) => <path key={`ms-${i}`} d={d} />)}
          </g>
          <g fill="#f9fbfb" stroke="#dae3e5" strokeWidth="0.9">
            {MOBILE_BUILDINGS.map((d, i) => <path key={`mb-${i}`} d={d} />)}
          </g>

          {/* Winding eastern river channel */}
          <path
            d="M 325 -15 C 308 85 292 185 305 295 C 316 395 288 490 282 630 L 336 630 C 344 490 370 395 358 295 C 345 185 360 85 378 -15 Z"
            fill="url(#advait-map-water)"
            stroke="#98c7d1"
            strokeWidth="2"
          />

          {/* Road casings & fills — minor streets terminate cleanly at park boundaries & riverfront */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 262 66 L 256 222 L 266 434 L 248 498" stroke="#dde6e8" strokeWidth="13" />
            <path d="M 68 152 L 259 146 M 68 224 L 256 222 M 68 298 L 260 292 M 68 372 L 263 366 M 68 442 L 266 434" stroke="#dde6e8" strokeWidth="13" />
            <path d="M 145.74 74.7 L 154 540 M 228 -10 L 232 498 M 248 542 L 248 630 M 386 62 L 376 625" stroke="#dde6e8" strokeWidth="13" />

            <path d="M -20 74 C 130 82 280 66 445 58" stroke="#cbd9de" strokeWidth="20" />

            <path d="M -20 538 L 112 540 M 78 518 L 106 630" stroke="#d2dfe3" strokeWidth="22" />
            <path d="M 68 -20 L 68 495 C 76 518 94 540 112 540 L 248 542" stroke="#cbd9de" strokeWidth="25" />
            <circle cx="248" cy="520" r="22" stroke="#cbd9de" strokeWidth="24" />
            <path d="M 260.93 537.8 L 445 405" stroke="#cbd9de" strokeWidth="25" />

            <path d="M 262 66 L 256 222 L 266 434 L 248 498" stroke="#ffffff" strokeWidth="9.5" />
            <path d="M 68 152 L 259 146 M 68 224 L 256 222 M 68 298 L 260 292 M 68 372 L 263 366 M 68 442 L 266 434" stroke="#ffffff" strokeWidth="9" />
            <path d="M 145.74 74.7 L 154 540 M 228 -10 L 232 498 M 248 542 L 248 630 M 386 62 L 376 625" stroke="#ffffff" strokeWidth="9.5" />

            <path d="M -20 74 C 130 82 280 66 445 58" stroke="#ffffff" strokeWidth="14" />

            <path d="M -20 538 L 112 540 M 78 518 L 106 630" stroke="#ffffff" strokeWidth="17" />
            <path d="M 68 -20 L 68 495 C 76 518 94 540 112 540 L 248 542" stroke="#ffffff" strokeWidth="19" />
            <circle cx="248" cy="520" r="22" stroke="#ffffff" strokeWidth="18" />
            <path d="M 260.93 537.8 L 445 405" stroke="#ffffff" strokeWidth="19" />
          </g>

          <circle cx="248" cy="520" r="10.5" fill="#d2ebd7" stroke="#b3d9bd" strokeWidth="1.5" />

          {/* River Bridges */}
          <g fill="none" filter="url(#advait-bridge-shadow)">
            <path d="M 284 520.9 L 334 484.5" stroke="#aebfc6" strokeWidth="24" />
            <path d="M 284 520.9 L 334 484.5" stroke="#ffffff" strokeWidth="19" />
            <path d="M 294 66.8 L 365 62.4" stroke="#aebfc6" strokeWidth="20" />
            <path d="M 294 66.8 L 365 62.4" stroke="#ffffff" strokeWidth="14" />
          </g>

          <path d="M 68 -10 L 68 485" fill="none" stroke="#c8d6da" strokeWidth="1.3" strokeDasharray="6 7" />

          {/* Clean route: white casing -> solid sky-blue planned -> solid royal-blue traveled + live flow */}
          <defs>
            <mask id="advait-mobile-route-mask">
              <path ref={flowMaskRef} d={MOBILE_ROUTE_D} fill="none" stroke="#ffffff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
            </mask>
          </defs>
          <path d={MOBILE_ROUTE_D} fill="none" stroke="#ffffff" strokeWidth="11.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d={MOBILE_ROUTE_D} fill="none" stroke="#76beea" strokeWidth="5.8" strokeLinecap="round" strokeLinejoin="round" />

          <path ref={routeRef} d={MOBILE_ROUTE_D} fill="none" stroke="none" />
          <path
            ref={trailRef}
            d={MOBILE_ROUTE_D}
            fill="none"
            stroke="#1e76b5"
            strokeWidth="6.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={MOBILE_ROUTE_D}
            fill="none"
            stroke="#9ee0ff"
            strokeWidth="2.4"
            strokeLinecap="round"
            mask="url(#advait-mobile-route-mask)"
            className="map-route-flow"
          />

          <RouteStartDot x={68} y={495} />
          <RealisticVehicle ref={carRef} initialTransform="translate(260.9 537.8) rotate(-36)" scale={0.92} />
          <GpsDropPin x={358} y={467} scale={0.92} />
        </svg>
      </div>
    );
  }

  return (
    <div className="tracking-hero__map" aria-hidden="true">
      <svg viewBox="0 0 1440 560" preserveAspectRatio="xMidYMid slice" className="h-full w-full block">
        <MapSvgDefs />

        <rect width="1440" height="560" fill="#eef1f0" />

        {/* Subtle district land-use zones */}
        <path d="M 320 90 L 980 78 L 1015 410 L 330 390 Z" fill="#eaeff0" opacity="0.7" />
        <path d="M 1220 110 L 1440 125 L 1440 560 L 1220 560 Z" fill="#f1f3f1" opacity="0.65" />

        {/* Road-sealed parks strictly bounded by centerlines beneath road casings & water */}
        <g fill="#d2ebd7">
          {DESKTOP_PARKS.map((d, i) => <path key={`dp-${i}`} d={d} />)}
        </g>

        <path
          d="M 142 178 C 162 174 182 186 177 204 C 172 220 144 221 134 208 C 127 196 131 182 142 178 Z"
          fill="url(#advait-park-pond)"
          stroke="#9ecad4"
          strokeWidth="1.2"
        />

        <g fill="#b5dcbf" opacity="0.85">
          <circle cx="94" cy="134" r="10" /><circle cx="112" cy="142" r="7.5" /><circle cx="166" cy="128" r="10" />
          <circle cx="182" cy="138" r="7" /><circle cx="108" cy="248" r="9.5" /><circle cx="198" cy="272" r="9" />
          <circle cx="228" cy="304" r="9.5" />
          <circle cx="458" cy="160" r="8.5" /><circle cx="492" cy="178" r="9" />
          <circle cx="996" cy="118" r="9" /><circle cx="1055" cy="112" r="10" />
          <circle cx="1082" cy="148" r="8.5" /><circle cx="1034" cy="198" r="10" /><circle cx="1072" cy="218" r="8.5" />
          <circle cx="1288" cy="326" r="8" /><circle cx="1312" cy="298" r="9" />
        </g>

        {/* 259 Non-colliding 2.5D Architectural Buildings strictly inside blocks */}
        <g fill="#dbe3e5" transform="translate(1.8 2.2)">
          {DESKTOP_BUILDINGS.map((d, i) => <path key={`ds-${i}`} d={d} />)}
        </g>
        <g fill="#f9fbfb" stroke="#dae3e5" strokeWidth="0.9">
          {DESKTOP_BUILDINGS.map((d, i) => <path key={`db-${i}`} d={d} />)}
        </g>

        {/* Meandering Natural Eastern River Channel */}
        <path
          d="M 1195 -25 C 1152 70 1104 158 1108 246 C 1112 326 1155 425 1142 580 L 1224 580 C 1236 425 1192 326 1186 246 C 1180 158 1228 70 1272 -25 Z"
          fill="url(#advait-map-water)"
          stroke="#96c6d0"
          strokeWidth="2"
        />

        {/* Complete Multi-Tier Urban Street Network: zero river intrusion & zero park slicing */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Tier 3: Fine vertical & eastbank streets (casings) — WC2 stops outside West Botanical Park */}
          <path d="M 105 -10 L 111.36 84.91 M 138.13 297.64 L 168 575 M 420 -10 L 464 575 M 592 -10 L 622 575 M 768 -10 L 795 575" stroke="#dde6e8" strokeWidth="11" />
          <path d="M 230.81 206 L 955.83 194 M 276.16 336 L 963.74 330 M 1262.29 355 L 1465 376 M 1282 518 L 1465 534" stroke="#dde6e8" strokeWidth="11" />

          {/* Tier 2: Connected collector avenues (casings) */}
          <path d="M -40 322 L 297.8 398 M -30 456 L 330.6 492 M 48 -10 L 114 575" stroke="#d6e2e4" strokeWidth="15" />
          <path d="M 325 -10 L 376 575 M 505 -10 L 542 575 M 680 -10 L 705 575 M 855 -10 L 885 575 M 945 -10 L 978 575" stroke="#d6e2e4" strokeWidth="13" />
          <path d="M 208.49 142 L 951.87 126 M 253.84 272 L 1023 318 M 345 510 L 1096 500" stroke="#d6e2e4" strokeWidth="13" />
          <path d="M 1032 295 L 951.87 126 M 1074 344 L 1105 575" stroke="#d5e1e4" strokeWidth="14" />

          {/* Continuous Eastbank Riverfront Collector strictly on dry land + Eastbank avenues */}
          <path d="M 1282 -10 L 1260 165 L 1252 265 L 1268 405 L 1288 580" stroke="#d5e1e4" strokeWidth="16" />
          <path d="M 1315 -10 L 1358 575 M 1392 -10 L 1425 575" stroke="#d5e1e4" strokeWidth="13" />
          <path d="M 1252 265 L 1465 282 M 1272 444 L 1465 464" stroke="#d5e1e4" strokeWidth="14" />

          {/* North White Arterial Expressway */}
          <path d="M -40 82 C 260 96 540 56 820 54 C 1050 52 1230 68 1470 48" stroke="#cbd9de" strokeWidth="25" />

          {/* Primary Arterial Highway & Route Corridor casings — true diagonal bridge over water */}
          <path d="M 145 -40 L 355 562" stroke="#cbd9de" strokeWidth="31" />
          <path d="M -40 222 L 285 360" stroke="#cedbe0" strokeWidth="27" />
          <path
            d="M 269.86 316.56 C 278.94 342.62 301.95 367.17 327.37 377.92 C 442.5 426.6 575 458 715 458 C 885 458 960 350 1055 350"
            stroke="#cbd9de"
            strokeWidth="31"
          />
          <circle cx="1055" cy="318" r="32" stroke="#cbd9de" strokeWidth="29" />
          <path d="M 1077.23 341.02 L 1239.08 184.72 C 1260.66 163.88 1285 160 1310 162 L 1480 174" stroke="#cbd9de" strokeWidth="30" />

          {/* Fine street fills */}
          <path d="M 105 -10 L 111.36 84.91 M 138.13 297.64 L 168 575 M 420 -10 L 464 575 M 592 -10 L 622 575 M 768 -10 L 795 575" stroke="#ffffff" strokeWidth="7.5" />
          <path d="M 230.81 206 L 955.83 194 M 276.16 336 L 963.74 330 M 1262.29 355 L 1465 376 M 1282 518 L 1465 534" stroke="#ffffff" strokeWidth="7.5" />

          {/* Secondary collector fills */}
          <path d="M -40 322 L 297.8 398 M -30 456 L 330.6 492 M 48 -10 L 114 575" stroke="#ffffff" strokeWidth="10.5" />
          <path d="M 325 -10 L 376 575 M 505 -10 L 542 575 M 680 -10 L 705 575 M 855 -10 L 885 575 M 945 -10 L 978 575" stroke="#ffffff" strokeWidth="9.5" />
          <path d="M 208.49 142 L 951.87 126 M 253.84 272 L 1023 318 M 345 510 L 1096 500" stroke="#ffffff" strokeWidth="9.5" />
          <path d="M 1032 295 L 951.87 126 M 1074 344 L 1105 575" stroke="#ffffff" strokeWidth="10" />

          {/* Eastbank Riverfront Collector + avenues fills */}
          <path d="M 1282 -10 L 1260 165 L 1252 265 L 1268 405 L 1288 580" stroke="#ffffff" strokeWidth="11.5" />
          <path d="M 1315 -10 L 1358 575 M 1392 -10 L 1425 575" stroke="#ffffff" strokeWidth="9.5" />
          <path d="M 1252 265 L 1465 282 M 1272 444 L 1465 464" stroke="#ffffff" strokeWidth="10" />

          {/* North Expressway crisp white fill */}
          <path d="M -40 82 C 260 96 540 56 820 54 C 1050 52 1230 68 1470 48" stroke="#ffffff" strokeWidth="18" />

          {/* Primary arterial crisp white fills */}
          <path d="M 145 -40 L 355 562" stroke="#ffffff" strokeWidth="23" />
          <path d="M -40 222 L 285 360" stroke="#ffffff" strokeWidth="20" />
          <path
            d="M 269.86 316.56 C 278.94 342.62 301.95 367.17 327.37 377.92 C 442.5 426.6 575 458 715 458 C 885 458 960 350 1055 350"
            stroke="#ffffff"
            strokeWidth="23"
          />
          <circle cx="1055" cy="318" r="32" stroke="#ffffff" strokeWidth="22" />
          <path d="M 1077.23 341.02 L 1239.08 184.72 C 1260.66 163.88 1285 160 1310 162 L 1480 174" stroke="#ffffff" strokeWidth="22.5" />
        </g>

        <path
          d="M -40 82 C 260 96 540 56 820 54 C 1050 52 1230 68 1470 48"
          fill="none"
          stroke="#c8d5d9"
          strokeWidth="1.3"
          strokeDasharray="7 8"
          opacity="0.85"
        />

        {/* Roundabout green center island */}
        <circle cx="1055" cy="318" r="19.5" fill="#d2ebd7" stroke="#b3d8bc" strokeWidth="1.8" />
        <circle cx="1055" cy="318" r="10" fill="#b7ddc2" opacity="0.7" />
        <circle cx="1055" cy="318" r="32" fill="none" stroke="#c7d5da" strokeWidth="1.2" strokeDasharray="5 6" />

        {/* Architectural River Bridges spanning strictly over the water channel */}
        <g fill="none" filter="url(#advait-bridge-shadow)">
          <path d="M 1104 315 L 1200 222.5" stroke="#aebfc6" strokeWidth="30" />
          <path d="M 1104 315 L 1200 222.5" stroke="#ffffff" strokeWidth="22.5" />
          <path d="M 1138 57.8 L 1244 58.1" stroke="#aebfc6" strokeWidth="25" />
          <path d="M 1138 57.8 L 1244 58.1" stroke="#ffffff" strokeWidth="18" />
        </g>

        {/* Subtle lane dividers on non-routed arterial extensions */}
        <g fill="none" stroke="#c8d5d9" strokeWidth="1.4" strokeDasharray="7 8" opacity="0.85">
          <path d="M 148 -30 L 214 156" />
          <path d="M 294 388 L 350 548" />
          <path d="M -25 228 L 265 352" />
          <path d="M 1322 163 L 1465 173" />
        </g>

        {/* Crosswalk markings */}
        <g stroke="#d2dde0" strokeWidth="1.6" opacity="0.85">
          <path d="M 262 325 L 278 320 M 264 331 L 280 326 M 266 337 L 282 332" />
          <path d="M 1018 355 L 1025 371 M 1024 352 L 1031 368" />
        </g>

        {/* Clean Solid Route Hierarchy: White casing -> Solid Sky Blue Ahead -> Royal Blue Traveled Trail */}
        <defs>
          <mask id="advait-desktop-route-mask">
            <path ref={flowMaskRef} d={DESKTOP_ROUTE_D} fill="none" stroke="#ffffff" strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" />
          </mask>
        </defs>
        <path d={DESKTOP_ROUTE_D} fill="none" stroke="#ffffff" strokeWidth="12.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={DESKTOP_ROUTE_D} fill="none" stroke="#78c0ec" strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />

        <path ref={routeRef} d={DESKTOP_ROUTE_D} fill="none" stroke="none" />
        <path
          ref={trailRef}
          d={DESKTOP_ROUTE_D}
          fill="none"
          stroke="#1e75b3"
          strokeWidth="6.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d={DESKTOP_ROUTE_D}
          fill="none"
          stroke="#9ee0ff"
          strokeWidth="2.5"
          strokeLinecap="round"
          mask="url(#advait-desktop-route-mask)"
          className="map-route-flow"
        />

        {/* Start waypoint dot -> Live Vehicle driving TO -> Destination GPS Drop Pin */}
        <RouteStartDot x={218.09} y={168} />
        <RealisticVehicle ref={carRef} initialTransform="translate(1152.7 268.1) rotate(-44)" scale={1} />
        <GpsDropPin x={1310} y={162} scale={1} />
      </svg>
    </div>
  );
};

export default TrackingMapHero;
