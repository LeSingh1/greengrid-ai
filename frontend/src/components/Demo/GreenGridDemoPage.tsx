import { useCallback, useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, ArrowRight, BarChart3, CheckCircle2,
  FileText, Leaf, Thermometer, TreePine, X, Zap,
  Bus, Home, Activity, Wind
} from 'lucide-react'

// ─── Map style ────────────────────────────────────────────────────────────────
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

// ─── Demo types ───────────────────────────────────────────────────────────────
type DemoStage = 'idle' | 'analyzing' | 'plan_ready' | 'applying' | 'applied'

// ─── Metrics ──────────────────────────────────────────────────────────────────
const METRICS = [
  { id: 'resilience',  label: 'Climate Resilience Score', before: 52,  after: 81,  unit: '/100', good: 'high', icon: '🌍' },
  { id: 'greenspace',  label: 'Green Space Access',        before: 52,  after: 74,  unit: '%',    good: 'high', icon: '🌳' },
  { id: 'co2',         label: 'CO₂ Estimate',              before: 100, after: 84,  unit: 'idx',  good: 'low',  icon: '💨' },
  { id: 'transit',     label: 'Transit Coverage',          before: 48,  after: 72,  unit: '%',    good: 'high', icon: '🚊' },
  { id: 'heat',        label: 'Heat Risk',                 before: 74,  after: 49,  unit: '/100', good: 'low',  icon: '🌡️' },
  { id: 'walkability', label: 'Walkability',               before: 56,  after: 76,  unit: '/100', good: 'high', icon: '🚶' },
  { id: 'canopy',      label: 'Tree Canopy Access',        before: 38,  after: 61,  unit: '%',    good: 'high', icon: '🌲' },
  { id: 'city15',      label: '15-Min City Score',         before: 54,  after: 79,  unit: '/100', good: 'high', icon: '📍' },
] as const

// ─── AI Plan recommendations ──────────────────────────────────────────────────
const PLAN_RECS = [
  {
    icon: '🌳', name: 'Central Green Corridor',
    detail: 'Downtown linear park reducing heat island by 3°C, serving 31,000 residents',
    color: '#22C55E', type: 'park',
  },
  {
    icon: '🚊', name: 'North Transit Hub',
    detail: 'Multi-modal station in growth corridor, 28,000 daily riders',
    color: '#8B5CF6', type: 'transit',
  },
  {
    icon: '🚌', name: 'West Congestion Relief Transit Stop',
    detail: 'BRT stop cutting vehicle miles in emissions zone by 12%',
    color: '#8B5CF6', type: 'transit',
  },
  {
    icon: '🏘️', name: 'New Housing Expansion Community Center',
    detail: '2.4 acres green space for 18,000 new east-side residents',
    color: '#F59E0B', type: 'community',
  },
  {
    icon: '🏥', name: 'South Emergency Gap Clinic',
    detail: 'Closes 8 km healthcare gap for 22,000 underserved residents',
    color: '#EF4444', type: 'health',
  },
  {
    icon: '🏫', name: 'East Education District School',
    detail: 'Solar K-12 with urban garden for 1,200 students',
    color: '#3B82F6', type: 'education',
  },
]

// ─── Gap findings (copilot analysis output) ───────────────────────────────────
const GAP_FINDINGS = [
  {
    id: 'heat', color: '#EF4444', icon: '🔴',
    title: 'Central Heat Island', severity: 'Critical',
    desc: 'Downtown core 6°C hotter than city average. 31,000 residents at risk.',
  },
  {
    id: 'west', color: '#F97316', icon: '🟠',
    title: 'West Congestion Emissions Zone', severity: 'High',
    desc: 'NO₂ levels 2.4× safe limit. Transit desert fuels 18km avg daily commute.',
  },
  {
    id: 'north', color: '#EAB308', icon: '🟡',
    title: 'North Transit Access Gap', severity: 'High',
    desc: 'New growth corridor of 12,000 residents has zero bus coverage.',
  },
  {
    id: 'east', color: '#F97316', icon: '🟠',
    title: 'New Housing Green Space Gap', severity: 'Medium',
    desc: 'East expansion has 0.4 m² green space per resident vs. 9 m² WHO target.',
  },
]

// ─── GeoJSON helpers ──────────────────────────────────────────────────────────
function makeBox(
  w: number, s: number, e: number, n: number,
  props: Record<string, unknown> = {}
): GeoJSON.Feature {
  return {
    type: 'Feature',
    properties: props,
    geometry: { type: 'Polygon', coordinates: [[[w,s],[e,s],[e,n],[w,n],[w,s]]] },
  }
}

function makeCircle(lng: number, lat: number, rLat: number, steps = 64): GeoJSON.Feature {
  const rLng = rLat * 0.82 // compensate for lng compression at lat ~36.7
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    return [lng + rLng * Math.cos(a), lat + rLat * Math.sin(a)]
  })
  return { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [pts] } }
}

// ─── Map data ─────────────────────────────────────────────────────────────────
// Fremon: fictional city placed over Fresno, CA geography
const FREMON = { lng: -119.785, lat: 36.748, zoom: 13 }
const FREMON_BBOX: [number, number, number, number] = [-119.93, 36.67, -119.63, 36.83]

const HEAT_FEATURES: GeoJSON.Feature[] = [
  makeBox(-119.800, 36.735, -119.770, 36.760, { color: '#EF4444', opacity: 0.45 }),
  makeBox(-119.850, 36.730, -119.815, 36.755, { color: '#F97316', opacity: 0.38 }),
  makeBox(-119.805, 36.790, -119.760, 36.825, { color: '#EAB308', opacity: 0.35 }),
  makeBox(-119.765, 36.730, -119.730, 36.760, { color: '#F97316', opacity: 0.36 }),
]

const PLAN_FEATURES: GeoJSON.Feature[] = [
  makeBox(-119.793, 36.744, -119.777, 36.754, { color: '#22C55E' }),
  makeBox(-119.791, 36.797, -119.779, 36.807, { color: '#8B5CF6' }),
  makeBox(-119.841, 36.736, -119.831, 36.744, { color: '#8B5CF6' }),
  makeBox(-119.752, 36.737, -119.741, 36.747, { color: '#F59E0B' }),
  makeBox(-119.789, 36.702, -119.780, 36.710, { color: '#EF4444' }),
  makeBox(-119.736, 36.724, -119.726, 36.732, { color: '#3B82F6' }),
]

const RING_FEATURES: { feature: GeoJSON.Feature; color: string }[] = [
  { feature: makeCircle(-119.785, 36.749, 0.0040), color: '#22C55E' }, // green corridor ~440m
  { feature: makeCircle(-119.785, 36.802, 0.0054), color: '#8B5CF6' }, // north transit ~600m
  { feature: makeCircle(-119.836, 36.740, 0.0045), color: '#8B5CF6' }, // west stop ~500m
  { feature: makeCircle(-119.747, 36.742, 0.0036), color: '#F59E0B' }, // community ~400m
  { feature: makeCircle(-119.785, 36.706, 0.0072), color: '#EF4444' }, // clinic ~800m
  { feature: makeCircle(-119.731, 36.728, 0.0054), color: '#3B82F6' }, // school ~600m
]

// Existing Fremon infrastructure (shown from the start)
const INFRA_FEATURES: GeoJSON.Feature[] = [
  makeBox(-119.788, 36.746, -119.782, 36.750, { color: '#2E86C1', label: 'City Hall' }),
  makeBox(-119.774, 36.749, -119.769, 36.753, { color: '#E74C3C', label: 'Medical Center' }),
  makeBox(-119.793, 36.743, -119.788, 36.747, { color: '#8B5CF6', label: 'Central Transit' }),
  makeBox(-119.808, 36.739, -119.800, 36.744, { color: '#3B82F6', label: 'Roosevelt HS' }),
  makeBox(-119.802, 36.759, -119.795, 36.765, { color: '#22C55E', label: 'Roeding Park' }),
]

// ─── Map animation helper ─────────────────────────────────────────────────────
function animateFill(
  map: maplibregl.Map,
  layerId: string,
  from: number,
  to: number,
  durationMs: number,
  delayMs = 0
) {
  setTimeout(() => {
    const start = performance.now()
    function frame(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'fill-opacity', from + (to - from) * eased)
      }
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, delayMs)
}

function animateLine(
  map: maplibregl.Map,
  layerId: string,
  from: number,
  to: number,
  durationMs: number,
  delayMs = 0
) {
  setTimeout(() => {
    const start = performance.now()
    function frame(now: number) {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'line-opacity', from + (to - from) * eased)
      }
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
  }, delayMs)
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCounter(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(target)
  useEffect(() => {
    if (!active) return
    const startVal = value
    const start = performance.now()
    function frame(now: number) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(Math.round(startVal + (target - startVal) * eased))
      if (t < 1) requestAnimationFrame(frame)
    }
    requestAnimationFrame(frame)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, active])
  return value
}

// ─── MetricCard ───────────────────────────────────────────────────────────────
function MetricCard({
  metric,
  applied,
  animateIndex,
}: {
  metric: typeof METRICS[number]
  applied: boolean
  animateIndex: number
}) {
  const displayVal = useCounter(applied ? metric.after : metric.before, applied, 1200 + animateIndex * 80)
  const improved = metric.good === 'high' ? metric.after > metric.before : metric.after < metric.before
  const change = metric.after - metric.before
  const sign = change > 0 ? '+' : ''

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${applied ? (improved ? '#22C55E44' : '#EF444444') : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 8,
      padding: '10px 12px',
      transition: 'border-color 0.4s',
    }}>
      <div style={{ fontSize: 10, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>
        {metric.icon} {metric.label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <strong style={{ fontSize: 22, color: 'white', fontVariantNumeric: 'tabular-nums' }}>
          {displayVal}
        </strong>
        <span style={{ fontSize: 11, color: '#6B7280' }}>{metric.unit}</span>
        {applied && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: 11, fontWeight: 700, color: improved ? '#22C55E' : '#EF4444', marginLeft: 'auto' }}
          >
            {sign}{change}
          </motion.span>
        )}
      </div>
      {applied && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: animateIndex * 0.06, duration: 0.5 }}
          style={{
            height: 2, marginTop: 6, borderRadius: 1,
            background: improved ? '#22C55E' : '#EF4444',
            transformOrigin: 'left',
          }}
        />
      )}
    </div>
  )
}

// ─── Environmental Impact Report ──────────────────────────────────────────────
function ReportModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)',
        overflow: 'auto', padding: '40px 24px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto', position: 'relative' }}>
        <button
          onClick={onClose}
          style={{ position: 'fixed', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '8px 12px', color: 'white', cursor: 'pointer', zIndex: 210 }}
        >
          <X size={16} />
        </button>

        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #064E3B, #065F46)', borderRadius: 16, padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Leaf size={28} color="#34D399" />
            <div>
              <h1 style={{ margin: 0, color: 'white', fontSize: 24, fontWeight: 800 }}>GreenGrid AI — Environmental Impact Report</h1>
              <p style={{ margin: 0, color: '#6EE7B7', fontSize: 13 }}>Fremon, CA · Analysis Date: 2026 · Growth Scenario: +35%</p>
            </div>
          </div>
          <div style={{ padding: '14px 18px', background: 'rgba(0,0,0,0.3)', borderRadius: 10, fontSize: 14, color: '#D1FAE5', lineHeight: 1.6 }}>
            GreenGrid AI analyzed Fremon under 35% projected growth, detected heat, green space, and transit gaps,
            then generated a climate-resilient infrastructure plan that improves Climate Resilience Score from
            <strong> 52 to 81</strong> and serves <strong>74,000 residents</strong> with improved green access.
          </div>
        </div>

        {/* Sections */}
        {[
          {
            title: '1. Executive Summary',
            content: `Fremon faces acute climate risk driven by a growing downtown heat island (6°C above city average),
            a transit desert in its western industrial corridor, and critically low green space in its eastern expansion zone.
            GreenGrid AI identified 4 primary risk zones and generated a 6-element climate infrastructure plan.`,
          },
          {
            title: '2. Climate Risks',
            content: `Central Heat Island: Downtown core reaches 41°C on summer afternoons, threatening 31,000 residents with heat
            stress. Urban heat island effect is amplified by impervious surface coverage of 74%.
            West Congestion Emissions Zone: NO₂ levels 2.4× safe limit from vehicle idling. Zero transit alternatives force
            car dependency with an average commute of 18 km each way.`,
          },
          {
            title: '3. Green Space Gaps',
            content: `Fremon provides 0.4 m² of accessible green space per resident in its eastern expansion zone — against the
            WHO recommended 9 m². Citywide tree canopy coverage is 38%, far below the 60% target for heat resilience.
            No parks within 400m walking distance for 44% of the population.`,
          },
          {
            title: '4. Transit and Emissions',
            content: `Transit coverage reaches only 48% of the urban area. The North growth corridor (12,000 residents) has zero
            bus service. CO₂ Estimate index is 100 (baseline), projected to reach 134 without intervention under 35% growth.
            The AI plan brings this to 84 through modal shift and green infrastructure.`,
          },
          {
            title: '5. AI Recommended Climate Plan',
            content: [
              '🌳 Central Green Corridor — Downtown linear park, 3°C heat reduction, 31,000 residents served',
              '🚊 North Transit Hub — Multi-modal station, 28,000 daily riders, eliminates north gap',
              '🚌 West Congestion Relief Transit Stop — BRT, 12% VMT reduction in emissions zone',
              '🏘️ New Housing Expansion Community Center — 2.4 acres green space, 18,000 residents',
              '🏥 South Emergency Gap Clinic — Closes 8 km healthcare gap, 22,000 residents',
              '🏫 East Education District School — Solar K-12 with urban garden, 1,200 students',
            ].join('\n'),
          },
        ].map((section) => (
          <div key={section.title} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 20, marginBottom: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ margin: '0 0 10px', color: '#34D399', fontSize: 15, fontWeight: 700 }}>{section.title}</h3>
            <p style={{ margin: 0, color: '#D1D5DB', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{section.content}</p>
          </div>
        ))}

        {/* Before / After metrics table */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 20, marginBottom: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 style={{ margin: '0 0 14px', color: '#34D399', fontSize: 15, fontWeight: 700 }}>6. Before & After Environmental Metrics</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
                {['Metric', 'Before', 'After', 'Change'].map((h) => (
                  <th key={h} style={{ textAlign: h === 'Metric' ? 'left' : 'center', padding: '6px 8px', color: '#9CA3AF', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRICS.map((m) => {
                const up = m.good === 'high' ? m.after > m.before : m.after < m.before
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '7px 8px', color: '#E5E7EB' }}>{m.icon} {m.label}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>{m.before}{m.unit}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: 'white', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{m.after}{m.unit}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', color: up ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
                      {m.after > m.before ? '+' : ''}{m.after - m.before}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Cost & residents */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          {[
            { label: 'Estimated Total Cost', value: '$340M', sub: '15-year phased implementation', color: '#F59E0B' },
            { label: 'Residents Benefited', value: '74,000', sub: 'direct beneficiaries of AI plan', color: '#22C55E' },
          ].map((card) => (
            <div key={card.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 18, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: card.color }}>{card.value}</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Assumptions + Next Steps */}
        {[
          {
            title: '7. Assumptions',
            items: [
              'Population growth model: 35% increase over 15 years based on regional projections',
              'Heat island calculations based on NOAA urban heat island coefficients',
              'Transit ridership projections from comparable California cities',
              'CO₂ estimates use CARB VMT methodology adjusted for city size',
            ],
          },
          {
            title: '8. Next Steps',
            items: [
              'Phase 1 (Year 1–3): Central Green Corridor and South Clinic — highest climate impact',
              'Phase 2 (Year 3–7): North Transit Hub and West Relief Stop — emissions reduction',
              'Phase 3 (Year 7–15): Community Center and East School — growth zone resilience',
              'Recommend quarterly GreenGrid AI re-analysis as growth data updates',
            ],
          },
        ].map((section) => (
          <div key={section.title} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 20, marginBottom: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
            <h3 style={{ margin: '0 0 12px', color: '#34D399', fontSize: 15, fontWeight: 700 }}>{section.title}</h3>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#D1D5DB', fontSize: 13, lineHeight: 1.8 }}>
              {section.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        ))}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '20px 0', color: '#6B7280', fontSize: 12 }}>
          Generated by GreenGrid AI · Tech to Treasure Environmental Hackathon 2026
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main demo page ───────────────────────────────────────────────────────────
export function GreenGridDemoPage() {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [stage, setStage] = useState<DemoStage>('idle')
  const [analysisStep, setAnalysisStep] = useState(0)
  const [visibleGaps, setVisibleGaps] = useState<number[]>([])
  const [visibleRecs, setVisibleRecs] = useState<number[]>([])
  const [showReport, setShowReport] = useState(false)
  const applied = stage === 'applied'

  // ── Initialize map ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: mapDivRef.current,
      style: MAP_STYLE,
      center: [FREMON.lng, FREMON.lat],
      zoom: FREMON.zoom,
      pitch: 20,
      maxBounds: [
        [FREMON_BBOX[0] - 0.05, FREMON_BBOX[1] - 0.05],
        [FREMON_BBOX[2] + 0.05, FREMON_BBOX[3] + 0.05],
      ],
    })
    mapRef.current = map

    map.on('load', () => {
      // ── Existing infrastructure layer ──────────────────────────────────────
      map.addSource('infra-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: INFRA_FEATURES },
      })
      map.addLayer({
        id: 'infra-fill',
        type: 'fill',
        source: 'infra-src',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.75,
        },
      })
      map.addLayer({
        id: 'infra-outline',
        type: 'line',
        source: 'infra-src',
        paint: { 'line-color': 'white', 'line-width': 1.5, 'line-opacity': 0.6 },
      })

      // ── Heat zone layers (initially hidden) ────────────────────────────────
      map.addSource('heat-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: HEAT_FEATURES },
      })
      map.addLayer({
        id: 'heat-fill',
        type: 'fill',
        source: 'heat-src',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0,
        },
      })
      map.addLayer({
        id: 'heat-outline',
        type: 'line',
        source: 'heat-src',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-dasharray': [3, 2],
          'line-opacity': 0,
        },
      })

      // ── Plan zone layers (initially hidden) ────────────────────────────────
      map.addSource('plan-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: PLAN_FEATURES },
      })
      map.addLayer({
        id: 'plan-fill',
        type: 'fill',
        source: 'plan-src',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0,
        },
      })
      map.addLayer({
        id: 'plan-outline',
        type: 'line',
        source: 'plan-src',
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.5,
          'line-opacity': 0,
        },
      })

      // ── Coverage ring layers (initially hidden) ─────────────────────────────
      RING_FEATURES.forEach(({ feature, color }, idx) => {
        const srcId = `ring-src-${idx}`
        const fillId = `ring-fill-${idx}`
        map.addSource(srcId, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [feature] },
        })
        map.addLayer({
          id: fillId,
          type: 'fill',
          source: srcId,
          paint: {
            'fill-color': color,
            'fill-opacity': 0,
          },
        })
      })

      setMapLoaded(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Run demo analysis sequence ──────────────────────────────────────────────
  const startAnalysis = useCallback(() => {
    if (!mapRef.current || !mapLoaded) return
    setStage('analyzing')
    setAnalysisStep(0)

    // Reveal heat zones
    animateFill(mapRef.current, 'heat-fill', 0, 0.4, 800, 400)
    animateLine(mapRef.current, 'heat-outline', 0, 0.8, 600, 400)

    // Fly to emphasize downtown heat zone
    mapRef.current.flyTo({ center: [FREMON.lng, FREMON.lat], zoom: 13.2, pitch: 30, duration: 1500 })

    // Step through analysis
    const steps = [800, 1600, 2500, 3400]
    steps.forEach((delay, i) => {
      setTimeout(() => setAnalysisStep(i + 1), delay)
    })

    // Reveal gap findings one by one
    GAP_FINDINGS.forEach((_, i) => {
      setTimeout(() => setVisibleGaps((prev) => [...prev, i]), 900 + i * 600)
    })

    // After analysis, show plan
    setTimeout(() => {
      setStage('plan_ready')
      PLAN_RECS.forEach((_, i) => {
        setTimeout(() => setVisibleRecs((prev) => [...prev, i]), i * 250)
      })
    }, 3800)
  }, [mapLoaded])

  // ── Apply AI plan ───────────────────────────────────────────────────────────
  const applyPlan = useCallback(() => {
    if (!mapRef.current) return
    setStage('applying')

    // Fade heat zones
    animateFill(mapRef.current, 'heat-fill', 0.4, 0, 1400)
    animateLine(mapRef.current, 'heat-outline', 0.8, 0, 1000)

    // Show plan zones
    animateFill(mapRef.current, 'plan-fill', 0, 0.72, 1000, 600)
    animateLine(mapRef.current, 'plan-outline', 0, 1, 800, 600)

    // Show coverage rings
    RING_FEATURES.forEach((_, idx) => {
      animateFill(mapRef.current!, `ring-fill-${idx}`, 0, 0.13, 900, 1000 + idx * 180)
    })

    // Fly to overview
    setTimeout(() => {
      mapRef.current?.flyTo({ center: [FREMON.lng - 0.005, FREMON.lat + 0.01], zoom: 12.6, pitch: 25, duration: 1800 })
    }, 400)

    setTimeout(() => setStage('applied'), 2200)
  }, [])

  // ─── Sidebar content ────────────────────────────────────────────────────────
  const copilotContent = () => {
    if (stage === 'idle') return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🌿</div>
          <h3 style={{ margin: '0 0 8px', color: 'white', fontSize: 16 }}>GreenGrid AI Copilot</h3>
          <p style={{ margin: 0, color: '#9CA3AF', fontSize: 13, lineHeight: 1.6 }}>
            Ready to analyze Fremon's climate resilience gaps and generate a sustainable infrastructure plan.
          </p>
        </div>
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 12, color: '#6EE7B7', fontWeight: 700, marginBottom: 8 }}>FREMON SNAPSHOT</div>
          {[
            ['Population', '213,000 residents'],
            ['Growth (projected)', '+35% by 2040'],
            ['Climate zone', 'Semi-arid / High Heat'],
            ['Urban growth rate', '2.8% annually'],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
              <span style={{ color: '#6B7280' }}>{label}</span>
              <span style={{ color: '#E5E7EB', fontWeight: 600 }}>{val}</span>
            </div>
          ))}
        </div>
        <button
          onClick={startAnalysis}
          disabled={!mapLoaded}
          style={{
            width: '100%', height: 44, borderRadius: 10, border: 'none',
            background: 'linear-gradient(135deg, #059669, #10B981)',
            color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            opacity: mapLoaded ? 1 : 0.5,
          }}
        >
          {mapLoaded ? '🔍 Analyze Fremon' : 'Loading map...'}
        </button>
      </div>
    )

    if (stage === 'analyzing' || stage === 'plan_ready' || stage === 'applying' || stage === 'applied') return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Analysis progress */}
        {stage === 'analyzing' && (
          <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 10, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                style={{ width: 14, height: 14, border: '2px solid #EAB308', borderTopColor: 'transparent', borderRadius: '50%' }}
              />
              <span style={{ color: '#FCD34D', fontSize: 12, fontWeight: 700 }}>ANALYZING FREMON...</span>
            </div>
            {[
              'Scanning satellite heat signatures...',
              'Measuring green space coverage...',
              'Mapping transit access gaps...',
              'Cross-referencing growth corridors...',
            ].slice(0, analysisStep).map((step) => (
              <div key={step} style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 3, paddingLeft: 22 }}>✓ {step}</div>
            ))}
          </div>
        )}

        {/* Gap findings */}
        {visibleGaps.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              ⚠ Gaps Detected
            </div>
            {GAP_FINDINGS.map((gap, i) => visibleGaps.includes(i) && (
              <motion.div
                key={gap.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  border: `1px solid ${gap.color}44`,
                  borderLeft: `3px solid ${gap.color}`,
                  borderRadius: 7,
                  padding: '8px 10px',
                  marginBottom: 7,
                  background: `${gap.color}0A`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>{gap.icon} {gap.title}</span>
                  <span style={{ fontSize: 10, color: gap.color, fontWeight: 700 }}>{gap.severity}</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: '#9CA3AF', lineHeight: 1.5 }}>{gap.desc}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* AI Plan */}
        {(stage === 'plan_ready' || stage === 'applying' || stage === 'applied') && visibleRecs.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: '#6EE7B7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 }}>
              ✦ AI Climate Plan
            </div>
            {PLAN_RECS.map((rec, i) => visibleRecs.includes(i) && (
              <motion.div
                key={rec.name}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  display: 'flex', gap: 8, padding: '7px 10px', marginBottom: 6,
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${rec.color}33`,
                  borderRadius: 7,
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>{rec.icon}</span>
                <div>
                  <div style={{ fontSize: 12, color: 'white', fontWeight: 700, marginBottom: 2 }}>{rec.name}</div>
                  <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.4 }}>{rec.detail}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Apply button */}
        {stage === 'plan_ready' && visibleRecs.length === PLAN_RECS.length && (
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={applyPlan}
            style={{
              width: '100%', height: 46, borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #059669, #10B981)',
              color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            ⚡ Apply AI Plan
          </motion.button>
        )}

        {stage === 'applying' && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: '#6EE7B7', fontSize: 13 }}>
            <motion.div
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              🌍 Applying climate infrastructure plan...
            </motion.div>
          </div>
        )}

        {stage === 'applied' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 10, padding: 14 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <CheckCircle2 size={16} color="#22C55E" />
              <span style={{ color: '#22C55E', fontWeight: 700, fontSize: 13 }}>Plan Applied</span>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
              Climate Resilience Score improved from <strong style={{ color: 'white' }}>52 → 81</strong>.
              74,000 residents gain improved green access.
            </p>
            <button
              onClick={() => setShowReport(true)}
              style={{
                width: '100%', height: 38, borderRadius: 8, border: '1px solid rgba(34,197,94,0.4)',
                background: 'transparent', color: '#34D399', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <FileText size={14} /> View Environmental Impact Report
            </button>
          </motion.div>
        )}
      </div>
    )

    return null
  }

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0D1117', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header style={{
        height: 54, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', background: 'rgba(13,17,23,0.96)',
        borderBottom: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Leaf size={22} color="#34D399" />
            <strong style={{ color: 'white', fontSize: 18, fontWeight: 800 }}>GreenGrid AI</strong>
          </div>
          <span style={{ color: '#374151', fontSize: 14 }}>|</span>
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>Fremon, CA · 213K residents · +35% growth projected</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Stage indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            {[
              { id: 'idle', label: 'Analyze', done: stage !== 'idle' },
              { id: 'plan', label: 'AI Plan', done: stage === 'applied' || stage === 'applying' },
              { id: 'applied', label: 'Applied', done: stage === 'applied' },
            ].map((step, i) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <span style={{ color: '#374151' }}>›</span>}
                <span style={{ color: step.done ? '#34D399' : '#4B5563', fontWeight: step.done ? 700 : 400 }}>
                  {step.done ? '✓ ' : ''}{step.label}
                </span>
              </div>
            ))}
          </div>

          {stage === 'applied' && (
            <button
              onClick={() => setShowReport(true)}
              style={{
                height: 32, padding: '0 14px', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 8,
                background: 'transparent', color: '#34D399', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <FileText size={12} /> Report
            </button>
          )}

          <div style={{ fontSize: 10, color: '#4B5563', textAlign: 'right', lineHeight: 1.4 }}>
            Tech to Treasure<br />Environmental Hackathon
          </div>
        </div>
      </header>

      {/* ── Main layout ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left copilot sidebar */}
        <aside style={{
          width: 290, flexShrink: 0, background: '#111827',
          borderRight: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto',
        }}>
          <div style={{ padding: '14px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
              AI Climate Copilot
            </div>
          </div>
          {copilotContent()}
        </aside>

        {/* Map */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

          {/* Map legend overlay */}
          {(stage === 'analyzing' || stage === 'plan_ready') && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                position: 'absolute', bottom: 20, left: 16,
                background: 'rgba(13,17,23,0.88)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ fontSize: 10, color: '#6B7280', fontWeight: 700, marginBottom: 6 }}>HEAT RISK ZONES</div>
              {[
                { color: '#EF4444', label: 'Critical heat island' },
                { color: '#F97316', label: 'Emissions / green gap' },
                { color: '#EAB308', label: 'Transit access gap' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 11, color: '#D1D5DB' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: item.color, opacity: 0.8 }} />
                  {item.label}
                </div>
              ))}
            </motion.div>
          )}

          {applied && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                position: 'absolute', bottom: 20, left: 16,
                background: 'rgba(13,17,23,0.88)', border: '1px solid rgba(34,197,94,0.25)',
                borderRadius: 10, padding: '10px 14px', backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ fontSize: 10, color: '#6EE7B7', fontWeight: 700, marginBottom: 6 }}>AI PLAN COVERAGE</div>
              {[
                { color: '#22C55E', label: 'Green corridor / parks' },
                { color: '#8B5CF6', label: 'Transit access rings' },
                { color: '#EF4444', label: 'Emergency service radius' },
                { color: '#3B82F6', label: 'Education service radius' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 11, color: '#D1D5DB' }}>
                  <div style={{ width: 12, height: 12, borderRadius: 2, background: item.color, opacity: 0.7 }} />
                  {item.label}
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Right metrics panel */}
        <aside style={{
          width: 260, flexShrink: 0, background: '#111827',
          borderLeft: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto',
        }}>
          <div style={{ padding: '14px 16px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)', position: 'sticky', top: 0, background: '#111827', zIndex: 1 }}>
            <div style={{ fontSize: 10, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: 700 }}>
              Environmental Metrics
            </div>
            {applied && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: 10, color: '#34D399', marginTop: 2 }}
              >
                ✓ After AI Plan Applied
              </motion.div>
            )}
          </div>

          <div style={{ padding: '12px 12px', display: 'grid', gap: 8 }}>
            {METRICS.map((metric, i) => (
              <MetricCard key={metric.id} metric={metric} applied={applied} animateIndex={i} />
            ))}
          </div>

          {!applied && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 11, color: '#4B5563', lineHeight: 1.6 }}>
              Metrics update after you apply the AI plan. Values reflect before-state under current infrastructure.
            </div>
          )}
        </aside>
      </div>

      {/* ── Report modal ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showReport && <ReportModal onClose={() => setShowReport(false)} />}
      </AnimatePresence>
    </div>
  )
}
