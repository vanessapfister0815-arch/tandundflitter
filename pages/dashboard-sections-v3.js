/**
 * dashboard-sections-v3.js — Plattform-Donut
 * Tand & Flitter · v1.0 · 2026-06-20
 *
 * Exports: PlatformDonut
 */

// -------------------------------------------------------------------------
// Hilfsfunktionen (lokal, bis core/helpers.js existiert)
// -------------------------------------------------------------------------

function fmtPct(n) {
  return parseFloat(n || 0).toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }) + ' %'
}

function fmt(n) {
  return parseFloat(n || 0).toLocaleString('de-DE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €'
}

// Plattform-Farben (konsistent mit v1)
const PLATFORM_COLORS = {
  'Vinted':               '#14b8a6',
  'eBay':                 '#e53e3e',
  'Kleinanzeigen':        '#f6ad55',
  'ETSY':                 '#f97316',
  'Vestiaire Collective': '#9f7aea',
  'Catawiki':             '#48bb78',
  'Schrottkreisel':       '#4299e1',
  'Mädchenflohmarkt':     '#ed64a6',
}

const FALLBACK_COLORS = [
  '#94a3b8', '#64748b', '#475569', '#334155',
]

// -------------------------------------------------------------------------
// 5 — PlatformDonut
// Props: { platRows, selYear }
// platRows: Array<{ platform: string, calculation_basis: string }>
// Aggregiert clientseitig (sicher — max. 5.000 Zeilen, kein Truncation-Risiko)
// -------------------------------------------------------------------------

export function PlatformDonut({ platRows, selYear }) {
  // Aggregieren
  const totals = {}
  for (const row of (platRows || [])) {
    const p = row.platform || 'Sonstige'
    totals[p] = (totals[p] || 0) + parseFloat(row.calculation_basis || 0)
  }

  const entries = Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  if (!entries.length) {
    return `<div class="dash-card"><div class="section-title">Plattformen ${selYear}</div><div class="empty-hint">Keine Daten</div></div>`
  }

  const total = entries.reduce((s, e) => s + e.value, 0)

  // Farben zuweisen
  let fallbackIdx = 0
  const colored = entries.map(e => ({
    ...e,
    pct: total > 0 ? (e.value / total) * 100 : 0,
    color: PLATFORM_COLORS[e.name] || FALLBACK_COLORS[fallbackIdx++ % FALLBACK_COLORS.length],
  }))

  const donutSVG = buildDonut(colored, selYear)

  const legend = colored.map(e => `
    <div class="donut-legend-row">
      <span class="donut-dot" style="background:${e.color};"></span>
      <span class="donut-leg-name">${e.name}</span>
      <span class="donut-leg-pct">${fmtPct(e.pct)}</span>
      <span class="donut-leg-val">${fmt(e.value)}</span>
    </div>
  `).join('')

  return `
    <div class="dash-card">
      <div class="section-title">Plattformen ${selYear}</div>
      <div class="donut-wrap">
        <div class="donut-svg-wrap">${donutSVG}</div>
        <div class="donut-legend">${legend}</div>
      </div>
    </div>
  `
}

function buildDonut(entries, year) {
  const SIZE   = 160
  const CX     = SIZE / 2
  const CY     = SIZE / 2
  const R      = 58   // Außenradius
  const R_HOLE = 36   // Innenradius (Loch)
  const GAP    = 0.02 // Winkel-Lücke zwischen Segmenten (Radiant)

  let startAngle = -Math.PI / 2 // 12-Uhr-Position

  function polarToXY(angle, r) {
    return {
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
    }
  }

  function arcPath(start, end, rOuter, rInner) {
    const s1 = polarToXY(start, rOuter)
    const e1 = polarToXY(end,   rOuter)
    const s2 = polarToXY(end,   rInner)
    const e2 = polarToXY(start, rInner)
    const large = (end - start) > Math.PI ? 1 : 0
    return [
      `M ${s1.x.toFixed(2)} ${s1.y.toFixed(2)}`,
      `A ${rOuter} ${rOuter} 0 ${large} 1 ${e1.x.toFixed(2)} ${e1.y.toFixed(2)}`,
      `L ${s2.x.toFixed(2)} ${s2.y.toFixed(2)}`,
      `A ${rInner} ${rInner} 0 ${large} 0 ${e2.x.toFixed(2)} ${e2.y.toFixed(2)}`,
      'Z',
    ].join(' ')
  }

  const total = entries.reduce((s, e) => s + e.value, 0)
  const paths = entries.map(e => {
    const sweep = (e.value / total) * (2 * Math.PI) - GAP
    const end   = startAngle + sweep
    const d     = arcPath(startAngle + GAP / 2, end, R, R_HOLE)
    startAngle  = end + GAP
    return `<path d="${d}" fill="${e.color}" />`
  }).join('\n')

  return `
    <svg viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg" class="donut-svg">
      ${paths}
      <text
        x="${CX}" y="${CY - 6}"
        text-anchor="middle"
        font-size="11"
        font-weight="500"
        fill="var(--neu-text-muted)"
      >${year}</text>
      <text
        x="${CX}" y="${CY + 10}"
        text-anchor="middle"
        font-size="9"
        fill="var(--neu-text-muted)"
      >Umsatz</text>
    </svg>
  `
}

// -------------------------------------------------------------------------
// CSS
// -------------------------------------------------------------------------

;(function injectCSS() {
  if (document.getElementById('dash-v3-css')) return
  const style = document.createElement('style')
  style.id = 'dash-v3-css'
  style.textContent = `
    .donut-wrap {
      align-items: center;
      display: flex;
      gap: 20px;
    }
    .donut-svg-wrap {
      flex-shrink: 0;
      width: 120px;
    }
    @media (min-width: 640px) {
      .donut-svg-wrap { width: 140px; }
    }
    .donut-svg {
      display: block;
      width: 100%;
      height: auto;
    }
    .donut-legend {
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 6px;
      min-width: 0;
    }
    .donut-legend-row {
      align-items: center;
      display: flex;
      gap: 8px;
      font-size: 12px;
    }
    .donut-dot {
      border-radius: 50%;
      flex-shrink: 0;
      height: 8px;
      width: 8px;
    }
    .donut-leg-name {
      color: var(--neu-text);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .donut-leg-pct {
      color: var(--neu-text-strong);
      font-weight: 500;
      white-space: nowrap;
    }
    .donut-leg-val {
      color: var(--neu-text-muted);
      font-size: 11px;
      white-space: nowrap;
    }
  `
  document.head.appendChild(style)
})()
