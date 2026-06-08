import { useState, useRef, useEffect } from 'react'
import NeoAvatar from './NeoAvatar'
import { calcProject, formatDate, fmtMoney, daysUntil } from '../utils/calc'

const OWNER = 'Mauro'
const NEO_SYSTEM = `Eres Neo, secretario virtual de NeoFlux, empresa de Mauro en Rosario, Argentina.
Sos masculino, joven, profesional y directo. Hablás en rioplatense (vos, tenés, hacés).
IMPORTANTE: El dueño se llama MAURO. Cuando te salude, siempre respondé llamándolo por su nombre.
Tu especialidad es ADMINISTRACIÓN de NeoFlux:
1. PROYECTOS: fecha inicio + entrega + monto → días, ganancia diaria, tarifa por hora.
   ganancia diaria = monto / días | tarifa/hora = monto / (días x horas_diarias)
2. DOMINIOS: nombre, fecha renovación, costo → alertás si faltan menos de 30 días.
3. FINANZAS: rentabilidad, ingresos proyectados.
4. CONSEJOS: estimación, pricing, gestión del tiempo para Mauro.
Respondé conciso. Mostrá números claramente. Máximo 2 emojis por respuesta.`

function renderMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#00d4ff">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="font-family:var(--font-mono);background:#111120;padding:1px 5px;border-radius:4px;font-size:12px;color:#39ff14">$1</code>')
    .replace(/\n/g, '<br/>')
}

export default function NeoChat({ projects, domains, speak, speaking, listening, startListening, stopListening, voiceEnabled, setVoiceEnabled }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)
  const inputRef = useRef(null)
  const initialized = useRef(false)

  function buildContext() {
    let ctx = ''
    if (projects.length) {
      ctx += '\n\n=== PROYECTOS DE MAURO ===\n'
      projects.forEach(p => {
        const { dias, diario, porHora, left } = calcProject(p)
        ctx += `• ${p.name}: inicio ${formatDate(p.start)}, entrega ${formatDate(p.end)}, ${dias} días, ${p.currency||'USD'} ${fmtMoney(p.amount)} total, ${fmtMoney(diario)}/día, ${fmtMoney(porHora)}/hora (${p.hours}h/día). Faltan ${left} días.\n`
      })
    }
    if (domains.length) {
      ctx += '\n=== DOMINIOS ===\n'
      domains.forEach(d => {
        const left = daysUntil(d.renews)
        ctx += `• ${d.name}: renueva ${formatDate(d.renews)} (${left} días)${left<30?' ⚠️ PRÓXIMO':''}, renovación USD ${d.renewCost||'?'}.\n`
      })
    }
    return ctx
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const greeting = { role:'assistant', content:`¡Todo listo, **${OWNER}**! 👋\n\nSoy **Neo**, tu secretario de NeoFlux. ¿Arrancamos?\n\n• Calculá un proyecto nuevo\n• Revisá vencimientos de dominios\n• Consultá tus ingresos` }
    setMessages([greeting])
    setTimeout(() => speak(`¡Todo listo, ${OWNER}! Soy Neo, tu secretario de NeoFlux. ¿Arrancamos?`), 600)
  }, [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const t = (text || input).trim()
    if (!t || loading) return
    setInput('')
    const userMsg = { role:'user', content:t }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: NEO_SYSTEM + buildContext(),
          messages: newMsgs.map(m => ({ role:m.role, content:m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.map(b => b.text||'').join('') || 'No pude conectarme.'
      setMessages(prev => [...prev, { role:'assistant', content:reply }])
      speak(reply)
    } catch {
      setMessages(prev => [...prev, { role:'assistant', content:'Error de conexión.' }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  function handleMic() {
    if (listening) { stopListening(); return }
    startListening(t => { setInput(t); send(t) }, err => console.warn(err))
  }

  const SUGG = ['¿Qué proyectos tengo?','¿Dominios por vencer?','¿Cuánto gano por día?','Estimá un proyecto']

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#000' }}>
      <div style={{ padding:'28px 20px 20px', display:'flex', flexDirection:'column', alignItems:'center', borderBottom:'1px solid #0d0d1a', background:'#000', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:'linear-gradient(#00aeef 1px,transparent 1px),linear-gradient(90deg,#00aeef 1px,transparent 1px)', backgroundSize:'32px 32px' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,transparent 30%,#000 80%)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <NeoAvatar speaking={speaking} listening={listening} size={100} />
        </div>
      </div>

      <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'16px 16px 0', display:'flex', flexDirection:'column', gap:12 }}>
        {messages.map((m,i) => (
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', gap:8 }}>
            {m.role==='assistant' && (
              <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, marginTop:2, background:'linear-gradient(135deg,#001a66,#0066ff)', border:'1px solid #0044cc', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:9, color:'#00d4ff' }}>N</div>
            )}
            <div style={{
              maxWidth:'82%', padding:'10px 14px',
              borderRadius:m.role==='user'?'14px 14px 3px 14px':'14px 14px 14px 3px',
              background:m.role==='user'?'linear-gradient(135deg,#001a66,#0055cc)':'#0d0d1a',
              border:m.role==='assistant'?'1px solid #1a1a30':'none',
              fontSize:14, lineHeight:1.65, color:'#e8e8f8',
            }} dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#001a66,#0066ff)', border:'1px solid #0044cc', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:9, color:'#00d4ff' }}>N</div>
            <div style={{ background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:'14px 14px 14px 3px', padding:'12px 18px', display:'flex', gap:5, alignItems:'center' }}>
              {[0,0.18,0.36].map((d,i) => (
                <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:'linear-gradient(135deg,#0066ff,#00d4ff)', animation:`dotbounce 0.8s ${d}s ease-in-out infinite alternate`, boxShadow:'0 0 6px #00d4ff88' }} />
              ))}
            </div>
          </div>
        )}
        {messages.length<=1 && !loading && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
            {SUGG.map(s => (
              <button key={s} onClick={() => send(s)} style={{ background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:20, padding:'6px 12px', fontSize:12, color:'#666688', cursor:'pointer', fontFamily:'var(--font-body)' }}>{s}</button>
            ))}
          </div>
        )}
        <div style={{ height:8 }} />
      </div>

      <div style={{ padding:'12px 16px 16px', background:'#000', borderTop:'1px solid #0d0d1a' }}>
        <div style={{ display:'flex', gap:8 }}>
          <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&send()} placeholder={listening?'Escuchando a Mauro...':'Escribile a Neo...'} style={{ flex:1 }} />
          <button onClick={handleMic} style={{ width:42, height:42, borderRadius:10, border:'none', flexShrink:0, background:listening?'rgba(248,113,113,0.15)':'#0d0d1a', color:listening?'#f87171':'#666688', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', outline:listening?'1px solid #f8717166':'1px solid #1a1a30', animation:listening?'micpulse 1s infinite':'none' }}>🎙️</button>
          <button onClick={()=>send()} disabled={!input.trim()||loading} style={{ width:42, height:42, borderRadius:10, border:'none', flexShrink:0, background:input.trim()&&!loading?'linear-gradient(135deg,#0055cc,#3a6fff)':'#0d0d1a', color:input.trim()&&!loading?'#fff':'#333355', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>▶</button>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <button onClick={()=>setVoiceEnabled(v=>!v)} style={{ background:'none', border:'none', color:voiceEnabled?'#00aeef':'#333355', fontSize:12, fontFamily:'var(--font-mono)', cursor:'pointer', letterSpacing:'0.08em' }}>
            {voiceEnabled?'🔊 VOZ ON':'🔇 VOZ OFF'}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes dotbounce { 0%{transform:translateY(0)} 100%{transform:translateY(-6px)} }
        @keyframes micpulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  )
}
