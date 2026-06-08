function SpeakingBars({ speaking, listening }) {
  const bars = 28
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:3, height:48, width:'100%' }}>
      {Array.from({ length: bars }).map((_, i) => {
        const center = bars / 2
        const dist = Math.abs(i - center) / center
        const delay = (i * 0.06) % 0.8
        const active = speaking || listening
        return (
          <div key={i} style={{
            width:3, borderRadius:3, flex:'0 0 auto', minHeight:3,
            height: active ? undefined : 3,
            background: speaking
              ? 'linear-gradient(to top, #00aeef, #39ff14)'
              : listening
              ? 'linear-gradient(to top, #3a6fff, #00aeef)'
              : '#222240',
            animation: active ? `neobar ${0.4 + dist * 0.4}s ease-in-out ${delay}s infinite alternate` : 'none',
            boxShadow: speaking ? '0 0 6px #00aeef' : listening ? '0 0 4px #3a6fff' : 'none',
            transition: 'background 0.4s, box-shadow 0.4s',
          }} />
        )
      })}
      <style>{`@keyframes neobar { 0%{height:3px} 100%{height:32px} }`}</style>
    </div>
  )
}

function ScanRing({ speaking, listening }) {
  const active = speaking || listening
  const color = speaking ? '#00d4ff' : '#3a6fff'
  return (
    <div style={{ position:'absolute', inset:-12, borderRadius:'50%', pointerEvents:'none' }}>
      <div style={{
        position:'absolute', inset:0, borderRadius:'50%',
        boxShadow: active ? `0 0 40px 8px ${color}55, 0 0 80px 16px ${color}22` : '0 0 20px 2px #00aeef22',
        transition:'box-shadow 0.4s',
        animation: active ? 'ringpulse 1.2s ease-in-out infinite' : 'none',
      }} />
      <div style={{
        position:'absolute', inset:0, borderRadius:'50%',
        border:'2px solid transparent',
        borderTopColor: active ? color : '#1a1a40',
        borderRightColor: active ? `${color}66` : 'transparent',
        animation:'rotatering 1.5s linear infinite',
        transition:'border-color 0.4s',
      }} />
      <div style={{
        position:'absolute', inset:4, borderRadius:'50%',
        border:'1px solid transparent',
        borderBottomColor: active ? (speaking ? '#39ff14' : '#00aeef') : '#111130',
        borderLeftColor: active ? `${speaking ? '#39ff14' : '#00aeef'}44` : 'transparent',
        animation:'rotatering 2s linear infinite reverse',
        transition:'border-color 0.4s',
      }} />
      <style>{`
        @keyframes rotatering { to { transform: rotate(360deg); } }
        @keyframes ringpulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  )
}

export default function NeoAvatar({ speaking, listening, size = 100 }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <ScanRing speaking={speaking} listening={listening} />
        <div style={{
          width:size, height:size, borderRadius:'50%', overflow:'hidden',
          border:`2px solid ${speaking ? '#00d4ff' : listening ? '#3a6fff' : '#1a1a40'}`,
          boxShadow: speaking
            ? '0 0 0 1px #00d4ff44, inset 0 0 30px #00d4ff22'
            : listening
            ? '0 0 0 1px #3a6fff44, inset 0 0 20px #3a6fff22'
            : '0 0 0 1px #1a1a4044',
          transition:'border-color 0.3s, box-shadow 0.4s',
          position:'relative', zIndex:1,
        }}>
          <img src="/logo.jpg" alt="Neo" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          {speaking && (
            <div style={{
              position:'absolute', inset:0,
              background:'linear-gradient(to bottom, transparent 40%, rgba(0,212,255,0.08) 50%, transparent 60%)',
              animation:'scanline 1.5s linear infinite',
            }} />
          )}
        </div>
        <div style={{
          position:'absolute', bottom:4, right:4, width:14, height:14, borderRadius:'50%',
          background: speaking ? '#39ff14' : listening ? '#00aeef' : '#1a1a40',
          border:'2px solid #000',
          boxShadow: speaking ? '0 0 8px #39ff14' : listening ? '0 0 6px #00aeef' : 'none',
          transition:'all 0.3s', zIndex:2,
          animation:(speaking||listening) ? 'dotpulse 1s ease-in-out infinite' : 'none',
        }} />
      </div>
      <div style={{ width:'100%', maxWidth:280 }}>
        <SpeakingBars speaking={speaking} listening={listening} />
      </div>
      <div style={{
        fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:'0.2em',
        color: speaking ? '#00d4ff' : listening ? '#3a6fff' : 'var(--text3)',
        textTransform:'uppercase', transition:'color 0.3s',
      }}>
        {speaking ? '◉ NEO HABLANDO' : listening ? '◎ ESCUCHANDO' : '○ EN ESPERA'}
      </div>
      <style>{`
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(200%)} }
        @keyframes dotpulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}
