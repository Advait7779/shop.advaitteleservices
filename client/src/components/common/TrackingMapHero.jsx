import React, { useEffect, useRef, useState } from 'react';
import {
  DESKTOP_BUILDINGS,
  DESKTOP_PARKS,
  MOBILE_BUILDINGS,
  MOBILE_PARKS,
} from './mapCityData';

const ROOF_MATERIALS = [
  { fill: '#8e9599', gableHi: '#a4abb0', gableLo: '#6c7378', ridge: '#bbc2c7', stroke: '#50575d', kind: 'flat' },
  { fill: '#885442', gableHi: '#a16651', gableLo: '#6a3e2f', ridge: '#b87a64', stroke: '#4a2a20', kind: 'gable' },
  { fill: '#545d66', gableHi: '#6b757f', gableLo: '#3d444c', ridge: '#828d98', stroke: '#2c333a', kind: 'flat' },
  { fill: '#9a8c79', gableHi: '#b1a38f', gableLo: '#776b5b', ridge: '#c5b8a4', stroke: '#574d40', kind: 'gable' },
  { fill: '#686e67', gableHi: '#7e857c', gableLo: '#4f544d', ridge: '#959c92', stroke: '#3c403a', kind: 'flat' },
];

/**
 * Extracts integer/float polygon bounding box from an SVG path string for overhead rooftop detail.
 */
const polyBBoxCache = new Map();
function getPolyBBox(d) {
  if (polyBBoxCache.has(d)) return polyBBoxCache.get(d);
  const nums = d.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 4) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i]);
    const y = Number(nums[i + 1]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const box = { minX, minY, w: maxX - minX, h: maxY - minY };
  polyBBoxCache.set(d, box);
  return box;
}

const MOBILE_TREES = [
  { cx: 114, cy: 30, r: 9, tone: 0 },
  { cx: 145, cy: 24, r: 10.5, tone: 1 },
  { cx: 186, cy: 35, r: 8, tone: 2 },
  { cx: 92, cy: -6, r: 8.5, tone: 1 },
  { cx: 168, cy: -8, r: 9.5, tone: 0 },
  { cx: 204, cy: 12, r: 7.5, tone: 2 },
  { cx: 362, cy: 535, r: 7.5, tone: 1 },
  { cx: 344, cy: 560, r: 6.5, tone: 0 },
  { cx: 356, cy: 578, r: 7.8, tone: 2 },
  { cx: 346, cy: 618, r: 8.2, tone: 1 },
  { cx: 248, cy: 520, r: 6.4, tone: 0 },
];

const DESKTOP_TREES = [
  // West Waterfront Park
  { cx: 94, cy: 134, r: 10.2, tone: 0 },
  { cx: 112, cy: 142, r: 7.8, tone: 1 },
  { cx: 88, cy: 168, r: 8.4, tone: 2 },
  { cx: 166, cy: 128, r: 10, tone: 1 },
  { cx: 182, cy: 138, r: 7.5, tone: 0 },
  { cx: 136, cy: 112, r: 8.8, tone: 2 },
  { cx: 108, cy: 248, r: 9.8, tone: 1 },
  { cx: 134, cy: 262, r: 7.4, tone: 0 },
  { cx: 176, cy: 256, r: 8.2, tone: 2 },
  { cx: 198, cy: 272, r: 9.2, tone: 0 },
  { cx: 228, cy: 304, r: 9.6, tone: 1 },
  // Mid-West Pocket Park
  { cx: 454, cy: 158, r: 8.6, tone: 1 },
  { cx: 472, cy: 172, r: 7.2, tone: 0 },
  { cx: 494, cy: 178, r: 9.2, tone: 2 },
  // North Riverbend Park & Riparian Canopy
  { cx: 988, cy: 112, r: 9.2, tone: 0 },
  { cx: 1016, cy: 96, r: 8.2, tone: 2 },
  { cx: 1055, cy: 112, r: 10.4, tone: 1 },
  { cx: 1084, cy: 92, r: 8.6, tone: 0 },
  { cx: 1086, cy: 148, r: 9, tone: 2 },
  { cx: 1034, cy: 198, r: 10.2, tone: 0 },
  { cx: 1072, cy: 218, r: 8.8, tone: 1 },
  { cx: 1094, cy: 182, r: 7.8, tone: 2 },
  { cx: 1052, cy: 256, r: 8.4, tone: 0 },
  { cx: 1084, cy: 268, r: 7.2, tone: 1 },
  // Eastbank River Park
  { cx: 1278, cy: 306, r: 7.8, tone: 2 },
  { cx: 1288, cy: 326, r: 8.4, tone: 0 },
  { cx: 1312, cy: 298, r: 9.2, tone: 1 },
  { cx: 1320, cy: 334, r: 7.4, tone: 2 },
  // Roundabout Central Oak Canopy
  { cx: 1055, cy: 318, r: 9.2, tone: 1 },
];

/**
 * Shared SVG definitions for photorealistic aerial ground textures, organic earth grain,
 * littoral river depth gradients, vehicle materials, and cast shadow filters.
 */
const MapSvgDefs = () => (
  <defs>
    {/* Large non-grid aerial parcel & yard pattern (mixed grass lawns, concrete drives, earth plots) */}
    <pattern id="advait-sat-terrain" width="311" height="263" patternUnits="userSpaceOnUse">
      <rect width="311" height="263" fill="#465041" />
      <path d="M 0 0 L 146 0 L 138 122 L 0 118 Z" fill="#4c5746" opacity="0.72" />
      <path d="M 148 6 L 311 0 L 311 134 L 142 126 Z" fill="#3f493c" opacity="0.68" />
      <path d="M 0 124 L 166 130 L 158 263 L 0 263 Z" fill="#525b4e" opacity="0.58" />
      <path d="M 164 132 L 311 138 L 311 263 L 160 263 Z" fill="#3b4639" opacity="0.65" />
      {/* Subtle manicured residential yard & concrete apron tones */}
      <rect x="18" y="22" width="54" height="38" fill="#5b6359" opacity="0.34" transform="rotate(-3 45 41)" />
      <rect x="196" y="42" width="66" height="44" fill="#364b34" opacity="0.45" transform="rotate(4 229 64)" />
      <rect x="68" y="162" width="62" height="42" fill="#3b4d37" opacity="0.44" transform="rotate(-2 99 183)" />
      <rect x="210" y="176" width="52" height="36" fill="#61665e" opacity="0.3" transform="rotate(2 236 194)" />
      <path d="M 90 12 L 132 10 L 128 96 L 84 92 Z" fill="#585447" opacity="0.22" />
      <path d="M 244 106 L 298 112 L 294 186 L 240 178 Z" fill="#5b5748" opacity="0.24" />
    </pattern>

    {/* Organic park meadow & shaded tree undergrowth pattern */}
    <pattern id="advait-sat-turf" width="139" height="127" patternUnits="userSpaceOnUse">
      <rect width="139" height="127" fill="#315230" />
      <path d="M 0 18 Q 52 4 74 56 Q 28 74 0 58 Z" fill="#3c6238" opacity="0.64" />
      <path d="M 68 62 Q 124 44 139 98 L 139 127 L 54 127 Z" fill="#284527" opacity="0.58" />
      <path d="M 46 8 Q 108 14 116 44 Q 72 52 46 8 Z" fill="#467040" opacity="0.36" />
    </pattern>

    {/* Static GPU-cached photographic aerial earth grain overlay */}
    <filter id="advait-sat-grain" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.11 0.14" numOctaves="4" seed="17" result="noise" />
      <feColorMatrix
        in="noise"
        type="matrix"
        values="0.22 0 0 0 0.08  0 0.25 0 0 0.10  0 0 0.19 0 0.06  0 0 0 0.36 0"
      />
    </filter>

    {/* Natural littoral-to-deep river channel gradient */}
    <linearGradient id="advait-map-water" x1="0" x2="1" y1="0" y2="0.15">
      <stop offset="0%" stopColor="#265460" />
      <stop offset="18%" stopColor="#163c4b" />
      <stop offset="52%" stopColor="#0f2c3a" />
      <stop offset="82%" stopColor="#173e4e" />
      <stop offset="100%" stopColor="#275765" />
    </linearGradient>

    {/* Subtle flow-aligned river surface riffles & sunlight glints */}
    <pattern id="advait-sat-water-tex" width="76" height="96" patternUnits="userSpaceOnUse" patternTransform="rotate(-14)">
      <path d="M 14 4 Q 18 24 13 46 T 15 92" fill="none" stroke="#3b7c91" strokeWidth="0.9" opacity="0.22" />
      <path d="M 38 10 Q 43 34 36 58 T 40 94" fill="none" stroke="#5aa1b5" strokeWidth="0.7" opacity="0.15" />
      <path d="M 61 0 Q 57 28 63 54 T 59 90" fill="none" stroke="#2d6377" strokeWidth="1.0" opacity="0.2" />
    </pattern>

    <linearGradient id="advait-park-pond" x1="0.1" x2="0.9" y1="0.1" y2="0.9">
      <stop offset="0%" stopColor="#235764" />
      <stop offset="55%" stopColor="#133845" />
      <stop offset="100%" stopColor="#0e2a35" />
    </linearGradient>

    <linearGradient id="advait-gps-pin-grad" x1="0.2" y1="0.1" x2="0.85" y2="0.95">
      <stop offset="0%" stopColor="#4bb9f5" />
      <stop offset="55%" stopColor="#268ad1" />
      <stop offset="100%" stopColor="#155e94" />
    </linearGradient>

    <linearGradient id="advait-car-body-grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f8fbfe" />
      <stop offset="50%" stopColor="#ffffff" />
      <stop offset="100%" stopColor="#dfe9f1" />
    </linearGradient>

    <linearGradient id="advait-car-roof-grad" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#edf4f9" />
      <stop offset="55%" stopColor="#ffffff" />
      <stop offset="100%" stopColor="#dde7ef" />
    </linearGradient>

    <linearGradient id="advait-car-glass-grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#0f1f2e" />
      <stop offset="65%" stopColor="#1b344a" />
      <stop offset="100%" stopColor="#2f5778" />
    </linearGradient>

    <linearGradient id="advait-headlight-beam" x1="0" y1="0.5" x2="1" y2="0.5">
      <stop offset="0%" stopColor="#fff6bd" stopOpacity="0.68" />
      <stop offset="55%" stopColor="#fff6bd" stopOpacity="0.24" />
      <stop offset="100%" stopColor="#fff6bd" stopOpacity="0" />
    </linearGradient>

    <filter id="advait-marker-shadow" x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy="4" stdDeviation="4.5" floodColor="#091521" floodOpacity="0.48" />
    </filter>

    <filter id="advait-car-shadow" x="-70%" y="-70%" width="240%" height="240%">
      <feDropShadow dx="2" dy="4" stdDeviation="3.4" floodColor="#08121b" floodOpacity="0.55" />
    </filter>

    <filter id="advait-bridge-shadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="4" dy="6" stdDeviation="4" floodColor="#061218" floodOpacity="0.64" />
    </filter>
  </defs>
);

const TREE_PALETTES = [
  { base: '#213f22', mid: '#31592e', hi: '#4e7b44', top: '#639154' },
  { base: '#264625', mid: '#3a6534', hi: '#5a874d', top: '#709e60' },
  { base: '#1e3920', mid: '#2d512c', hi: '#48713f', top: '#5b864f' },
];

/**
 * Multi-lobed scalloped overhead tree canopies with long angled sunlight shadows.
 */
const SatelliteTrees = ({ trees }) => (
  <g>
    <g fill="#0c170d" opacity="0.48">
      {trees.map(({ cx, cy, r }, i) => (
        <g key={`ts-${i}`} transform={`translate(${cx + 3.2} ${cy + 4.1})`}>
          <circle cx="0" cy="0" r={r * 0.96} />
          <circle cx={r * 0.34} cy={-r * 0.16} r={r * 0.62} />
          <circle cx={-r * 0.28} cy={r * 0.24} r={r * 0.58} />
        </g>
      ))}
    </g>
    {trees.map(({ cx, cy, r, tone = 0 }, i) => {
      const pal = TREE_PALETTES[tone % TREE_PALETTES.length];
      return (
        <g key={`tree-${i}`} transform={`translate(${cx} ${cy})`}>
          {/* Irregular scalloped leaf crown base */}
          <circle cx={r * 0.32} cy={r * 0.18} r={r * 0.68} fill={pal.base} />
          <circle cx={-r * 0.26} cy={r * 0.26} r={r * 0.72} fill={pal.base} />
          <circle cx="0" cy="0" r={r * 0.92} fill={pal.base} />
          {/* Sun-facing foliage clumps */}
          <circle cx={-r * 0.14} cy={-r * 0.12} r={r * 0.76} fill={pal.mid} />
          <circle cx={r * 0.22} cy={-r * 0.24} r={r * 0.52} fill={pal.mid} />
          {/* Upper-left canopy sunlit lobes */}
          <circle cx={-r * 0.28} cy={-r * 0.26} r={r * 0.46} fill={pal.hi} opacity="0.88" />
          <circle cx={-r * 0.34} cy={-r * 0.32} r={r * 0.22} fill={pal.top} opacity="0.68" />
        </g>
      );
    })}
  </g>
);

/**
 * Photorealistic 2.5D aerial buildings with soft sunlight shadows, dark south-east side walls,
 * gabled roof ridges on homes, and overhead parapet/HVAC terrace boxes on larger roofs.
 */
const SatelliteBuildings = ({ buildings, prefix }) => (
  <g>
    {/* Deep angled sunlight ground shadow */}
    <g fill="#081016" opacity="0.52" transform="translate(3.8 4.8)">
      {buildings.map((d, i) => <path key={`${prefix}-s-${i}`} d={d} />)}
    </g>
    {/* Crisp dark 3D building facade extrusion on south/east side */}
    <g fill="#202730" opacity="0.95" transform="translate(1.2 1.6)">
      {buildings.map((d, i) => <path key={`${prefix}-w-${i}`} d={d} />)}
    </g>
    {/* Material roof surfaces */}
    {ROOF_MATERIALS.map((mat, matIdx) => (
      <g key={`${prefix}-r-${matIdx}`} fill={mat.fill} stroke={mat.stroke} strokeWidth="0.65">
        {buildings.map((d, i) => (
          i % ROOF_MATERIALS.length === matIdx ? <path key={`${prefix}-b-${i}`} d={d} /> : null
        ))}
      </g>
    ))}
    {/* Pitched roof sunlight slopes, ridge lines, & flat rooftop HVAC mechanical details */}
    <g pointerEvents="none">
      {buildings.map((d, i) => {
        const mat = ROOF_MATERIALS[i % ROOF_MATERIALS.length];
        const box = getPolyBBox(d);
        if (!box || box.w < 7 || box.h < 7) return null;
        const { minX, minY, w, h } = box;
        if (mat.kind === 'gable') {
          const isWide = w >= h;
          const xMid = minX + w / 2;
          const yMid = minY + h / 2;
          return isWide ? (
            <g key={`${prefix}-d-${i}`}>
              <rect x={minX + 1.1} y={minY + 1.1} width={Math.max(1, w - 2.2)} height={Math.max(1, h / 2 - 1.1)} fill={mat.gableHi} opacity="0.46" />
              <line x1={minX + 1.5} y1={yMid} x2={minX + w - 1.5} y2={yMid} stroke={mat.ridge} strokeWidth="0.7" opacity="0.82" />
            </g>
          ) : (
            <g key={`${prefix}-d-${i}`}>
              <rect x={minX + 1.1} y={minY + 1.1} width={Math.max(1, w / 2 - 1.1)} height={Math.max(1, h - 2.2)} fill={mat.gableHi} opacity="0.46" />
              <line x1={xMid} y1={minY + 1.5} x2={xMid} y2={minY + h - 1.5} stroke={mat.ridge} strokeWidth="0.7" opacity="0.82" />
            </g>
          );
        }
        if (w >= 13 && h >= 11) {
          const isRect = (d.match(/ L /g) || []).length === 3;
          const hvacW = Math.min(4.6, w * 0.24);
          const hvacH = Math.min(3.8, h * 0.24);
          return (
            <g key={`${prefix}-d-${i}`}>
              {isRect && (
                <rect
                  x={minX + 1.8}
                  y={minY + 1.8}
                  width={w - 3.6}
                  height={h - 3.6}
                  fill="none"
                  stroke={mat.ridge}
                  strokeWidth="0.55"
                  opacity="0.42"
                />
              )}
              {isRect && (
                <rect
                  x={minX + w * 0.34}
                  y={minY + h * 0.32}
                  width={hvacW}
                  height={hvacH}
                  fill="#7a8289"
                  stroke="#252c33"
                  strokeWidth="0.45"
                  opacity="0.85"
                />
              )}
            </g>
          );
        }
        return null;
      })}
    </g>
  </g>
);

/**
 * Flush aerial concrete river bridge with open continuous roadway ends,
 * side barrier guardrails, bank abutments, deck expansion joints, and
 * shadow clipped cleanly to the river channel below.
 */
const AerialRiverBridge = ({ p1, p2, roadWidth, riverD, clipId }) => {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const half = roadWidth / 2;
  const wallH = 2.6;

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={riverD} />
        </clipPath>
      </defs>

      {/* Directional sunlight bridge shadow falling strictly over the river water */}
      <g clipPath={`url(#${clipId})`}>
        <g transform={`translate(${p1.x + 5} ${p1.y + 7.5}) rotate(${angle})`}>
          <rect
            x="-4"
            y={-(half + wallH)}
            width={len + 8}
            height={roadWidth + wallH * 2}
            fill="#051117"
            opacity="0.62"
          />
        </g>
      </g>

      {/* Open-ended bridge deck aligned flush with approach road */}
      <g transform={`translate(${p1.x} ${p1.y}) rotate(${angle})`}>
        {/* Subtle south-east structural deck thickness lip */}
        <rect x="0" y={half + wallH - 0.3} width={len} height="1.5" fill="#1b2229" opacity="0.82" />

        {/* Sunlit bridge wearing-course asphalt seamlessly overlapping land tarmac at ends */}
        <rect x="-1.2" y={-half} width={len + 2.4} height={roadWidth} fill="#363d46" />

        {/* Subtle transverse concrete bridge expansion joints */}
        {[1.5, len * 0.35, len * 0.65, len - 1.5].map((jx, idx) => (
          <line
            key={`joint-${idx}`}
            x1={jx}
            y1={-half}
            x2={jx}
            y2={half}
            stroke="#505963"
            strokeWidth="0.7"
            opacity="0.72"
          />
        ))}

        {/* Continuous road dashed centerline across bridge */}
        <line
          x1="2"
          y1="0"
          x2={len - 2}
          y2="0"
          stroke="#b9c2ca"
          strokeWidth="0.95"
          strokeDasharray="5 5.5"
          opacity="0.48"
        />

        {/* Parallel side concrete parapet walls (never capping across roadway ends) */}
        <rect x="0" y={-(half + wallH)} width={len} height={wallH} fill="#6b7279" />
        <rect x="0" y={-(half + wallH - 0.55)} width={len} height="1.1" fill="#a2abb2" />

        <rect x="0" y={half} width={len} height={wallH} fill="#636a71" />
        <rect x="0" y={half + 0.55} width={len} height="1.05" fill="#959ea6" />

        {/* Flared concrete bank abutment piers anchoring side barriers into the shore */}
        <rect x="-2.2" y={-(half + wallH + 0.9)} width="5.2" height={wallH + 0.9} fill="#7d848b" stroke="#3c434a" strokeWidth="0.4" />
        <rect x="-2.2" y={half} width="5.2" height={wallH + 0.9} fill="#757c83" stroke="#3c434a" strokeWidth="0.4" />
        <rect x={len - 3} y={-(half + wallH + 0.9)} width="5.2" height={wallH + 0.9} fill="#7d848b" stroke="#3c434a" strokeWidth="0.4" />
        <rect x={len - 3} y={half} width="5.2" height={wallH + 0.9} fill="#757c83" stroke="#3c434a" strokeWidth="0.4" />
      </g>
    </g>
  );
};

/**
 * Clean GPS trip start waypoint beacon marking where the vehicle departs from.
 */
const RouteStartDot = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle cx="0" cy="0" r="8.5" fill="#4cc2ff" opacity="0.32" />
    <circle cx="0" cy="0" r="4.5" fill="#1e88e5" stroke="#ffffff" strokeWidth="2" />
  </g>
);

/**
 * Realistic GPS drop/destination pin with luminous beacon pulse rings over satellite earth.
 */
const GpsDropPin = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <circle cx="0" cy="0" r="10" className="map-gps-pulse map-gps-pulse--outer" />
    <circle cx="0" cy="0" r="10" className="map-gps-pulse map-gps-pulse--inner" />
    <circle cx="0" cy="0" r="14" fill="#4cc2ff" opacity="0.22" />

    <ellipse cx="0" cy="2" rx="9" ry="3.4" fill="#091521" opacity="0.45" />

    <g filter="url(#advait-marker-shadow)">
      <path
        d="M 0 0 C -3.8 -8 -16 -20 -16 -30 C -16 -38.8 -8.8 -46 0 -46 C 8.8 -46 16 -38.8 16 -30 C 16 -20 3.8 -8 0 0 Z"
        fill="url(#advait-gps-pin-grad)"
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="-30" r="6.5" fill="#ffffff" />
      <circle cx="0" cy="-30" r="2.8" fill="#186fb0" />
    </g>
  </g>
);

/**
 * Realistic top-down Pearl-White modern SUV/Sedan oriented along +X,
 * driving along dark asphalt roads towards the GPS drop pin.
 */
const RealisticVehicle = React.forwardRef(({ initialTransform, scale = 1 }, ref) => (
  <g ref={ref} transform={initialTransform}>
    <g transform={`scale(${scale * 0.82})`}>
      <circle cx="0" cy="0" r="15" className="map-car-gps-ring" />
      <circle cx="0" cy="0" r="13.5" fill="#4cc2ff" opacity="0.24" />

      <polygon points="16,-6.8 48,-15 48,15 16,6.8" fill="url(#advait-headlight-beam)" />

      <g filter="url(#advait-car-shadow)">
        <rect x="-14" y="-10.2" width="6.6" height="2.4" rx="1" fill="#111d28" />
        <rect x="-14" y="7.8" width="6.6" height="2.4" rx="1" fill="#111d28" />
        <rect x="7.4" y="-10.2" width="6.6" height="2.4" rx="1" fill="#111d28" />
        <rect x="7.4" y="7.8" width="6.6" height="2.4" rx="1" fill="#111d28" />

        <path
          d="M -18.5 -6.2 C -18.5 -8.5 -16 -9.4 -11.5 -9.4 L 11.2 -9.4 C 15.6 -9.4 18.6 -7.4 19.2 -3.8 L 19.2 3.8 C 18.6 7.4 15.6 9.4 11.2 9.4 L -11.5 9.4 C -16 9.4 -18.5 8.5 -18.5 6.2 Z"
          fill="url(#advait-car-body-grad)"
          stroke="#1b354b"
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
 * Zero-rerender animation driver binding vehicle movement and glowing blue
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
 * road ahead remains clean dark asphalt with zero pre-drawn blue line.
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
      <path d={routeD} fill="none" stroke="#d8f0ff" strokeWidth={haloWidth} strokeLinecap="round" strokeLinejoin="round" opacity="0.34" />
      <path d={routeD} fill="none" stroke="#2596eb" strokeWidth={coreWidth} strokeLinecap="round" strokeLinejoin="round" />
      <path d={routeD} fill="none" stroke="#c4ecff" strokeWidth={pulseWidth} strokeLinecap="round" className="map-route-flow" />
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
    const mobileRiverD =
      'M 332 -50 C 312 65 292 185 305 295 C 316 395 288 490 280 665 L 334 665 C 344 490 370 395 358 295 C 345 185 364 65 385 -50 Z';

    return (
      <div className="tracking-hero__map" aria-hidden="true">
        <svg viewBox="-22 -28 474 676" preserveAspectRatio="xMidYMid slice" className="h-full w-full block">
          <MapSvgDefs />
          {/* Photographic ground + park meadow covered by GPU-cached fractal earth grain */}
          <rect x="-60" y="-60" width="550" height="740" fill="url(#advait-sat-terrain)" />

          <g fill="url(#advait-sat-turf)">
            {MOBILE_PARKS.map((d, i) => <path key={`mp-${i}`} d={d} />)}
          </g>
          <rect x="-60" y="-60" width="550" height="740" filter="url(#advait-sat-grain)" opacity="0.65" pointerEvents="none" />

          {/* Architectural 2.5D satellite rooftops with cast sunlight shadows & roof details */}
          <SatelliteBuildings buildings={MOBILE_BUILDINGS} prefix="m" />

          {/* Natural riparian river banks and textured deep river channel */}
          <path d={mobileRiverD} fill="none" stroke="#424e3c" strokeWidth="12" strokeLinejoin="round" />
          <path d={mobileRiverD} fill="none" stroke="#6c6959" strokeWidth="6.5" strokeLinejoin="round" />
          <path d={mobileRiverD} fill="url(#advait-map-water)" stroke="#235059" strokeWidth="3.2" />
          <path d={mobileRiverD} fill="url(#advait-sat-water-tex)" />

          {/* Realistic worn asphalt street network with slim concrete sidewalks */}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 262 66 L 256 222 L 266 434 L 248 498" stroke="#61686e" strokeWidth="8.6" />
            <path d="M 68 152 L 259 146 M 68 224 L 256 222 M 68 298 L 260 292 M 68 372 L 263 366 M 68 442 L 266 434" stroke="#61686e" strokeWidth="8.6" />
            <path d="M 145.74 74.7 L 156 665 M 228 -45 L 232 498 M 248 542 L 248 665 M 386 62 L 375 665" stroke="#61686e" strokeWidth="8.6" />

            <path d="M -50 74 C 120 82 280 66 480 56" stroke="#6c7379" strokeWidth="13.5" />

            <path d="M -50 538 L 112 540 M 78 518 L 112 665" stroke="#686f75" strokeWidth="14.8" />
            <path d="M 68 -45 L 68 495 C 76 518 94 540 112 540 L 248 542" stroke="#6f767c" strokeWidth="16.4" />
            <circle cx="248" cy="520" r="22" stroke="#6f767c" strokeWidth="16" />
            <path d="M 260.93 537.8 L 480 380" stroke="#6f767c" strokeWidth="16.4" />

            {/* Dark tarmac asphalt surfaces */}
            <path d="M 262 66 L 256 222 L 266 434 L 248 498" stroke="#3c434b" strokeWidth="6.4" />
            <path d="M 68 152 L 259 146 M 68 224 L 256 222 M 68 298 L 260 292 M 68 372 L 263 366 M 68 442 L 266 434" stroke="#3c434b" strokeWidth="6" />
            <path d="M 145.74 74.7 L 156 665 M 228 -45 L 232 498 M 248 542 L 248 665 M 386 62 L 375 665" stroke="#3c434b" strokeWidth="6.4" />

            <path d="M -50 74 C 120 82 280 66 480 56" stroke="#2f353c" strokeWidth="10.2" />

            <path d="M -50 538 L 112 540 M 78 518 L 112 665" stroke="#343b42" strokeWidth="11.5" />
            <path d="M 68 -45 L 68 495 C 76 518 94 540 112 540 L 248 542" stroke="#2c3238" strokeWidth="13.2" />
            <circle cx="248" cy="520" r="22" stroke="#2c3238" strokeWidth="12.8" />
            <path d="M 260.93 537.8 L 480 380" stroke="#2c3238" strokeWidth="13.2" />
          </g>

          <circle cx="248" cy="520" r="11.5" fill="url(#advait-sat-turf)" stroke="#4f6e4e" strokeWidth="1.2" />

          {/* Diagonal Concrete River Bridge cleanly spanning both riverbanks */}
          <AerialRiverBridge
            p1={{ x: 286.6, y: 519.0 }}
            p2={{ x: 353.0, y: 470.8 }}
            roadWidth={13.2}
            riverD={mobileRiverD}
            clipId="advait-mobile-bridge-water-clip"
          />

          <SatelliteTrees trees={MOBILE_TREES} />

          <path d="M 68 -40 L 68 485" fill="none" stroke="#b9c2ca" strokeWidth="1.0" strokeDasharray="5 6" opacity="0.48" />

          {/* Traveled cyan-blue GPS trail revealed strictly behind moving vehicle */}
          <LiveGpsTrail
            routeD={MOBILE_ROUTE_D}
            maskId="advait-mobile-route-mask"
            routeRef={routeRef}
            trailRef={trailRef}
            flowMaskRef={flowMaskRef}
            haloWidth={7.8}
            coreWidth={4.6}
            pulseWidth={1.7}
          />

          <RouteStartDot x={68} y={495} />
          <RealisticVehicle ref={carRef} initialTransform="translate(260.9 537.8) rotate(-36)" scale={0.86} />
          <GpsDropPin x={358} y={467} scale={0.82} />
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

        {/* Photographic satellite terrain + parklands textured with static fractal grain */}
        <rect x="-150" y="-80" width="1740" height="720" fill="url(#advait-sat-terrain)" />

        {/* Subtle regional satellite ground biome variation */}
        <path d="M 320 90 L 980 78 L 1015 410 L 330 390 Z" fill="#354036" opacity="0.28" />
        <path d="M 1220 100 L 1540 120 L 1540 610 L 1220 610 Z" fill="#4f5b4a" opacity="0.24" />

        <g fill="url(#advait-sat-turf)">
          {DESKTOP_PARKS.map((d, i) => <path key={`dp-${i}`} d={d} />)}
        </g>

        <rect x="-150" y="-80" width="1740" height="720" filter="url(#advait-sat-grain)" opacity="0.65" pointerEvents="none" />

        <path
          d="M 142 178 C 162 174 182 186 177 204 C 172 220 144 221 134 208 C 127 196 131 182 142 178 Z"
          fill="url(#advait-park-pond)"
          stroke="#466c5f"
          strokeWidth="1.6"
        />

        {/* Architectural 2.5D satellite rooftops with cast sunlight shadows & roof details */}
        <SatelliteBuildings buildings={DESKTOP_BUILDINGS} prefix="d" />

        {/* Natural riparian banks & textured deep aerial river channel */}
        <path d={desktopRiverD} fill="none" stroke="#424e3c" strokeWidth="13.5" strokeLinejoin="round" />
        <path d={desktopRiverD} fill="none" stroke="#6c6959" strokeWidth="7" strokeLinejoin="round" />
        <path d={desktopRiverD} fill="url(#advait-map-water)" stroke="#235059" strokeWidth="3.2" />
        <path d={desktopRiverD} fill="url(#advait-sat-water-tex)" />

        {/* Realistic worn dark asphalt street network & slim concrete sidewalks */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Tier 3: Fine vertical & eastbank concrete curbs */}
          <path d="M 102.65 -45 L 111.36 84.91 M 138.13 297.64 L 171.23 605 M 417.4 -45 L 466.3 605 M 590.2 -45 L 623.5 605 M 766.4 -45 L 796.4 605" stroke="#60676d" strokeWidth="7.4" />
          <path d="M 230.81 206 L 955.83 194 M 276.16 336 L 963.74 330 M 1262.29 355 L 1540 383.8 M 1282 518 L 1540 540.6" stroke="#60676d" strokeWidth="7.4" />

          {/* Tier 2: Connected collector avenue curbs */}
          <path d="M -90 310.75 L 297.8 398 M -90 450 L 330.6 492 M 44.0 -45 L 117.4 605" stroke="#686f76" strokeWidth="10.2" />
          <path d="M 321.9 -45 L 378.6 605 M 502.8 -45 L 543.9 605 M 678.5 -45 L 706.3 605 M 853.2 -45 L 886.5 605 M 943.0 -45 L 979.7 605" stroke="#686f76" strokeWidth="8.8" />
          <path d="M 208.49 142 L 951.87 126 M 253.84 272 L 1023 318 M 345 510 L 1096 500" stroke="#686f76" strokeWidth="8.8" />
          <path d="M 1032 295 L 951.87 126 M 1074 344 L 1109.0 605" stroke="#686f76" strokeWidth="9.2" />

          {/* Eastbank Riverfront Collector + avenues curbs */}
          <path d="M 1286.7 -45 L 1260 165 L 1252 265 L 1268 405 L 1290.9 605" stroke="#686f76" strokeWidth="10.4" />
          <path d="M 1312.4 -45 L 1360.2 605 M 1390.0 -45 L 1426.7 605" stroke="#686f76" strokeWidth="8.8" />
          <path d="M 1252 265 L 1540 288 M 1272 444 L 1540 471.8" stroke="#686f76" strokeWidth="9.2" />

          {/* North Expressway sidewalks */}
          <path d="M -90 80 C 260 96 540 56 820 54 C 1050 52 1230 68 1540 46" stroke="#71787f" strokeWidth="16.2" />

          {/* Primary Arterial Highway & Route Corridor concrete shoulders */}
          <path d="M 139.8 -55 L 370.0 605" stroke="#727980" strokeWidth="19.5" />
          <path d="M -90 200.8 L 285 360" stroke="#6c737a" strokeWidth="17.2" />
          <path
            d="M 269.86 316.56 C 278.94 342.62 301.95 367.17 327.37 377.92 C 442.5 426.6 575 458 715 458 C 885 458 960 350 1055 350"
            stroke="#727980"
            strokeWidth="19.5"
          />
          <circle cx="1055" cy="318" r="32" stroke="#727980" strokeWidth="18.2" />
          <path d="M 1077.23 341.02 L 1239.08 184.72 C 1260.66 163.88 1285 160 1310 162 L 1540 178.2" stroke="#727980" strokeWidth="19.2" />

          {/* Fine street weathered asphalt */}
          <path d="M 102.65 -45 L 111.36 84.91 M 138.13 297.64 L 171.23 605 M 417.4 -45 L 466.3 605 M 590.2 -45 L 623.5 605 M 766.4 -45 L 796.4 605" stroke="#3e464e" strokeWidth="5.2" />
          <path d="M 230.81 206 L 955.83 194 M 276.16 336 L 963.74 330 M 1262.29 355 L 1540 383.8 M 1282 518 L 1540 540.6" stroke="#3e464e" strokeWidth="5.2" />

          {/* Secondary collector weathered asphalt */}
          <path d="M -90 310.75 L 297.8 398 M -90 450 L 330.6 492 M 44.0 -45 L 117.4 605" stroke="#353c43" strokeWidth="7.8" />
          <path d="M 321.9 -45 L 378.6 605 M 502.8 -45 L 543.9 605 M 678.5 -45 L 706.3 605 M 853.2 -45 L 886.5 605 M 943.0 -45 L 979.7 605" stroke="#353c43" strokeWidth="6.8" />
          <path d="M 208.49 142 L 951.87 126 M 253.84 272 L 1023 318 M 345 510 L 1096 500" stroke="#353c43" strokeWidth="6.8" />
          <path d="M 1032 295 L 951.87 126 M 1074 344 L 1109.0 605" stroke="#353c43" strokeWidth="7.2" />

          {/* Eastbank collector tarmac */}
          <path d="M 1286.7 -45 L 1260 165 L 1252 265 L 1268 405 L 1290.9 605" stroke="#353c43" strokeWidth="8.2" />
          <path d="M 1312.4 -45 L 1360.2 605 M 1390.0 -45 L 1426.7 605" stroke="#353c43" strokeWidth="6.8" />
          <path d="M 1252 265 L 1540 288 M 1272 444 L 1540 471.8" stroke="#353c43" strokeWidth="7.2" />

          {/* North Expressway tarmac */}
          <path d="M -90 80 C 260 96 540 56 820 54 C 1050 52 1230 68 1540 46" stroke="#2d333a" strokeWidth="13" />

          {/* Primary arterial tarmac */}
          <path d="M 139.8 -55 L 370.0 605" stroke="#2c3238" strokeWidth="15.8" />
          <path d="M -90 200.8 L 285 360" stroke="#32383f" strokeWidth="14" />
          <path
            d="M 269.86 316.56 C 278.94 342.62 301.95 367.17 327.37 377.92 C 442.5 426.6 575 458 715 458 C 885 458 960 350 1055 350"
            stroke="#2c3238"
            strokeWidth="15.8"
          />
          <circle cx="1055" cy="318" r="32" stroke="#2c3238" strokeWidth="14.8" />
          <path d="M 1077.23 341.02 L 1239.08 184.72 C 1260.66 163.88 1285 160 1310 162 L 1540 178.2" stroke="#2c3238" strokeWidth="15.4" />
        </g>

        <path
          d="M -90 80 C 260 96 540 56 820 54 C 1050 52 1230 68 1540 46"
          fill="none"
          stroke="#b9c2ca"
          strokeWidth="1.0"
          strokeDasharray="6 7"
          opacity="0.48"
        />

        {/* Roundabout green landscaped island & ring markings */}
        <circle cx="1055" cy="318" r="21.5" fill="url(#advait-sat-turf)" stroke="#4f6e4e" strokeWidth="1.4" />
        <circle cx="1055" cy="318" r="32" fill="none" stroke="#b9c2ca" strokeWidth="0.9" strokeDasharray="4.5 5.5" opacity="0.5" />

        {/* Flush Concrete River Bridge spanning both riverbanks seamlessly */}
        <AerialRiverBridge
          p1={{ x: 1106.0, y: 313.2 }}
          p2={{ x: 1195.9, y: 226.45 }}
          roadWidth={15.6}
          riverD={desktopRiverD}
          clipId="advait-desktop-bridge-water-clip"
        />

        {/* Overhead 3D sunlit satellite tree canopies in parks & roundabout */}
        <SatelliteTrees trees={DESKTOP_TREES} />

        {/* Subtle faded road lane dividers */}
        <g fill="none" stroke="#b9c2ca" strokeWidth="1.0" strokeDasharray="6 7" opacity="0.48">
          <path d="M 143 -45 L 214 156" />
          <path d="M 294 388 L 365 590" />
          <path d="M -75 207.2 L 265 352" />
          <path d="M 1322 163 L 1525 177" />
        </g>

        {/* Weathered crosswalk markings */}
        <g stroke="#c8d1d8" strokeWidth="1.2" opacity="0.5">
          <path d="M 264 325 L 276 321 M 266 330 L 278 326 M 268 335 L 280 331" />
          <path d="M 1018 355 L 1024 368 M 1024 352 L 1030 365" />
        </g>

        {/* Traveled cyan-blue GPS trail revealed strictly behind moving vehicle */}
        <LiveGpsTrail
          routeD={DESKTOP_ROUTE_D}
          maskId="advait-desktop-route-mask"
          routeRef={routeRef}
          trailRef={trailRef}
          flowMaskRef={flowMaskRef}
          haloWidth={8.2}
          coreWidth={4.8}
          pulseWidth={1.8}
        />

        {/* Start waypoint dot -> Live Vehicle driving TO -> Destination GPS Drop Pin */}
        <RouteStartDot x={218.09} y={168} />
        <RealisticVehicle ref={carRef} initialTransform="translate(1152.7 268.1) rotate(-44)" scale={0.94} />
        <GpsDropPin x={1310} y={162} scale={0.88} />
      </svg>
    </div>
  );
};

export default TrackingMapHero;
