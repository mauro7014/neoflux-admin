export default function NeoAvatar({ speaking, listening }) {
  const bars = 32
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
      {/* Ecualizador */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'center', gap:3, height:56, width:'100%', maxWidth:300, padding:'0 8px' }}>
        {Array.from({ length: bars }).map((_, i) => {
          const center = bars / 2
          const dist = Math.abs(i - center) / center
          const delay = (i * 0.07) % 1
          const active = speaking || listening
          return (
            <div key={i} style={{
              flex:1, borderRadius:'3px 3px 0 0', minHeight:4,
              background: speaking
                ? `linear-gradient(to top, #0066ff, #00d4ff ${50 + dist*30}%, #39ff14)`
                : listening
                ? `linear-gradient(to top, #3a6fff, #00aeef)`
                : '#1a1a30',
              animation: active
                ? `eq-bar-${i % 8} ${0.35 + dist * 0.45}s ease-in-out ${delay}s infinite alternate`
                : 'none',
              boxShadow: speaking ? '0 0 6px #00d4ff88' : listening ? '0 0 4px #3a6fff66' : 'none',
              transition: 'background 0.3s',
              height: active ? undefined : 4,
            }} />
          )
        })}
      </div>
      {/* Base */}
      <div style={{ width:'100%', maxWidth:300, height:1, background:'linear-gradient(90deg,transparent,#1a1a40,transparent)' }} />
      {/* Status */}
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.2em', color: speaking?'#00d4ff':listening?'#3a6fff':'#333355', textTransform:'uppercase', transition:'color 0.3s' }}>
        {speaking ? '◉ NEO HABLANDO' : listening ? '◎ ESCUCHANDO' : '○ EN ESPERA'}
      </div>
      <style>{`
        ${Array.from({length:8}).map((_,i) => `
          @keyframes eq-bar-${i} {
            0%   { height: ${4 + i*2}px; }
            25%  { height: ${18 + i*5}px; }
            50%  { height: ${10 + i*7}px; }
            75%  { height: ${26 + i*4}px; }
            100% { height: ${14 + i*6}px; }
          }
        `).join('')}
      `}</style>
    </div>
  )
}
