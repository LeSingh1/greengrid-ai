import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'

interface Props {
  onEnter: () => void
}

export function LandingScreen({ onEnter }: Props) {
  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', background: '#030D08' }}>
      <GreenCityscape />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(3,13,8,0.5) 0%, rgba(3,13,8,0.2) 50%, rgba(3,13,8,0.7) 100%)',
      }} />

      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', padding: 24 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            width: 'min(540px, 100%)',
            background: 'rgba(3,13,8,0.82)',
            border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 20,
            padding: '40px 36px',
            textAlign: 'center',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 0 60px rgba(34,197,94,0.08)',
          }}
        >
          {/* Hackathon badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999,
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.25)',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 10, color: '#34D399', fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase' }}>
              🏆 Tech to Treasure Environmental Hackathon
            </span>
          </div>

          <GreenGridLogo large />

          <p style={{ margin: '14px 0 6px', color: '#6EE7B7', fontSize: 17, fontWeight: 600 }}>
            AI climate resilience planner for growing cities.
          </p>
          <p style={{ margin: '0 0 28px', color: '#4B5563', fontSize: 14, lineHeight: 1.6 }}>
            GreenGrid AI helps cities test sustainable infrastructure plans that improve
            green space, transit access, walkability, heat resilience, and emissions.
          </p>

          {/* City card */}
          <div style={{
            background: 'rgba(52,211,153,0.05)',
            border: '1px solid rgba(52,211,153,0.15)',
            borderRadius: 12,
            padding: '14px 18px',
            marginBottom: 20,
            textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>🌆</div>
              <div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: 16 }}>Fremon, CA</div>
                <div style={{ color: '#6B7280', fontSize: 12 }}>Growing city · Central Valley climate</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                ['213,000', 'residents'],
                ['+35%', 'projected growth'],
                ['Heat island', 'detected downtown'],
                ['0.4 m²', 'green space / resident'],
              ].map(([val, label]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                  <div style={{ color: '#34D399', fontWeight: 700, fontSize: 14 }}>{val}</div>
                  <div style={{ color: '#6B7280', fontSize: 11 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onEnter}
            style={{
              width: '100%', height: 50, borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #059669, #10B981, #34D399)',
              color: 'white', fontWeight: 800, fontSize: 16, cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(16,185,129,0.35)',
            }}
          >
            🔍 Analyze Fremon&apos;s Climate Resilience
          </motion.button>

          <div style={{ marginTop: 16, fontSize: 11, color: '#374151' }}>
            Map · AI Copilot · Environmental Metrics · Impact Report
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export function GreenGridLogo({ large = false }: { large?: boolean }) {
  const size = large ? 44 : 22
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: large ? 12 : 8 }}>
      <div style={{
        width: size, height: size,
        background: 'linear-gradient(135deg, #059669, #34D399)',
        borderRadius: large ? 12 : 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: large ? '0 4px 16px rgba(16,185,129,0.4)' : 'none',
        flexShrink: 0,
      }}>
        <Leaf size={Math.round(size * 0.6)} color="white" />
      </div>
      <strong style={{ color: 'white', fontSize: large ? 36 : 16, fontWeight: 800, letterSpacing: -0.5 }}>
        GreenGrid AI
      </strong>
    </div>
  )
}

function GreenCityscape() {
  const buildings = Array.from({ length: 40 }, (_, i) => ({
    x: i * 38, h: 60 + ((i * 41) % 160), w: 24 + ((i * 11) % 24),
  }))
  return (
    <svg
      style={{
        position: 'absolute', inset: 'auto 0 0 0', width: '130%', height: '55%', opacity: 0.4,
        animation: 'skylineDrift 50s linear infinite',
      }}
      viewBox="0 0 1520 500"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="greenGlow" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#059669" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1520" height="500" fill="url(#greenGlow)" />
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={500 - b.h} width={b.w} height={b.h}
            fill={i % 3 === 0 ? '#071A0F' : '#0A1F14'} />
          {i % 5 === 0 && (
            <rect x={b.x + 4} y={500 - b.h - 8} width={b.w - 8} height={8}
              fill="#059669" opacity="0.6" rx="2" />
          )}
          {Array.from({ length: Math.floor(b.h / 22) }, (_, j) => (
            <rect key={j} x={b.x + 6} y={500 - b.h + 8 + j * 20} width="5" height="7"
              fill={j % 3 === 0 ? '#34D399' : '#10B981'} opacity="0.5" />
          ))}
        </g>
      ))}
      <rect x="0" y="498" width="1520" height="2" fill="#059669" opacity="0.3" />
    </svg>
  )
}
