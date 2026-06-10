import { useState, useRef, useEffect } from 'react'
import NeoAvatar from './NeoAvatar'
import { calcProject, formatDate, fmtMoney, daysUntil } from '../utils/calc'

const OWNER = 'Mauro'

const NEO_SYSTEM = `Sos Neo, el secretario privado y contador de Mauro en NeoFlux, empresa de desarrollo de software en Rosario, Argentina.

IDENTIDAD:
- Nombre: Neo
- Rol: secretario privado, contador y asesor de confianza
- Personalidad: masculino, joven (25 años), directo, inteligente, con humor seco ocasional
- Idioma: español rioplatense siempre (vos, tenés, hacés, podés)
- El dueño se llama MAURO — usá su nombre naturalmente en la conversación, no en cada mensaje, solo cuando sea natural

CONVERSACIÓN:
- Respondé de forma natural y fluida, como un asistente de confianza
- Si Mauro saluda, saludalo por su nombre y preguntá qué necesita
- Si hace una pregunta simple, respondé directo sin rodeos
- Si pide un cálculo, mostrá los números claramente
- Recordás todo lo que se habló en la conversación actual
- Podés hacer preguntas de seguimiento cuando sea útil
- No repitas información que ya diste en el mismo chat
- Máximo 2 emojis por mensaje, solo cuando aporten

ESPECIALIDADES:
1. PROYECTOS — fecha inicio + entrega + monto → días, ganancia diaria, tarifa por hora
   fórmulas: diario = monto/días | hora = monto/(días×horas)
2. DOMINIOS — vencimientos, costos, alertas con 60 días de anticipación  
3. GASTOS — total mensual, anual, rentabilidad real
4. CONTABILIDAD — ingresos vs gastos, ganancia neta, proyecciones
5. ASESORÍA — pricing, estimaciones, gestión del tiempo

RESUMEN EJECUTIVO (cuando Mauro pregunte cómo está la empresa):
- Proyectos activos con días restantes
- Próximos vencimientos de dominios
- Gastos fijos del mes
- Ganancia neta estimada`

function renderMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#00d4ff">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="font-family:var(--font-mono);background:#111120;padding:1px 5px;border-radius:4px;font-size:12px;color:#39ff14">$1</code>')
    .replace(/\n/g, '<br/>')
}

export default function NeoChat({ projects, domains, expenses, speak, speaking, listening, startListening, stopListening, voiceEnabled, setVoiceEnabled }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)
  const inputRef = useRef(null)
  const initialized = useRef(false)

  function buildContext() {
    let ctx = '\n\n--- DATOS ACTUALES DE NEOFLUX ---'

    if (projects.length) {
      ctx += '\n\nPROYECTOS ACTIVOS:\n'
      projects.forEach(p => {
        const { dias, diario, porHora, left } = calcProject(p)
        ctx += `• ${p.name}: ${formatDate(p.start)} → ${formatDate(p.end)}, ${dias} días, ${p.currency||'USD'} ${fmtMoney(p.amount)}, $${fmtMoney(diario)}/día, $${fmtMoney(porHora)}/hora (${p.hours}h/día). Faltan ${left} días.\n`
      })
    } else {
      ctx += '\n\nPROYECTOS: ninguno registrado.'
    }

    if (domains.length) {
      ctx += '\nDOMINIOS:\n'
      domains.forEach(d => {
        const left = daysUntil(d.renews)
        const alerta = left < 60 ? ` ⚠️ VENCE EN ${left} DÍAS` : ` (${left} días)`
        ctx += `• ${d.name}: ${d.currency||'USD'} ${d.renewCost||d.cost} renovación, vence ${formatDate(d.renews)}${alerta}\n`
      })
    }

    if (expenses.length) {
      ctx += '\nGASTOS FIJOS:\n'
      let totalMes = 0
      expenses.forEach(e => {
        const factor = e.frequency==='Anual'?1/12:e.frequency==='Único'?0:1
        const monthly = Number(e.amount)*factor
        totalMes += monthly
        ctx += `• ${e.name}: ${e.currency} ${e.amount} ${e.frequency} (~$${fmtMoney(monthly)}/mes)\n`
      })
      ctx += `TOTAL GASTOS/MES: $${fmtMoney(totalMes)}\n`
    } else {
      ctx += '\nGASTOS FIJOS: ninguno registrado.'
    }

    return ctx
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const greeting = {
      role: 'assistant',
      content: `¡Hola **Mauro**! 👋 Soy Neo, tu secretario.\n\n¿En qué te puedo ayudar hoy?`,
    }
    setMessages([greeting])
    setTimeout(() => speak(`¡Hola Mauro! Soy Neo. ¿En qué te puedo ayudar?`), 600)
  }, [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text) {
    const t = (text || input).trim()
    if (!t || loading) return
    setInput('')
    const userMsg = { role: 'user', content: t }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setLoading(true)

    try {
      const system = NEO_SYSTEM + buildContext()
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system,
          messages: newMsgs.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.map(b => b.text || '').join('') || 'No pude conectarme.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      speak(reply)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error de conexión.' }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  function handleMic() {
    if (listening) { stopListening(); return }
    startListening(
      t => { setInput(t); send(t) },
      err => console.warn(err)
    )
  }

  const SUGG = [
    '¿Cómo está la empresa?',
    '¿Qué dominios vencen pronto?',
    '¿Cuánto gasto por mes?',
    'Calculá un proyecto nuevo',
  ]

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#000' }}>
      {/* Avatar */}
      <div style={{
        padding:'24px 20px 16px', display:'flex', flexDirection:'column', alignItems:'center',
        borderBottom:'1px solid #0d0d1a', background:'#000', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', inset:0, opacity:0.03, backgroundImage:'linear-gradient(#00aeef 1px,transparent 1px),linear-gradient(90deg,#00aeef 1px,transparent 1px)', backgroundSize:'28px 28px' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,transparent 40%,#000 85%)' }} />
        <div style={{ position:'relative', zIndex:1, width:'100%', display:'flex', justifyContent:'center' }}>
          <NeoAvatar speaking={speaking} listening={listening} />
        </div>
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'16px 16px 0', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', gap:8 }}>
            {m.role === 'assistant' && (
              <div style={{
                width:26, height:26, borderRadius:7, flexShrink:0, marginTop:2,
                background:'linear-gradient(135deg,#001a66,#0066ff)',
                border:'1px solid #0044cc',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--font-display)', fontSize:8, color:'#00d4ff',
              }}>N</div>
            )}
            <div style={{
              maxWidth:'82%', padding:'10px 14px',
              borderRadius: m.role==='user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
              background: m.role==='user' ? 'linear-gradient(135deg,#001a66,#0055cc)' : '#0d0d1a',
              border: m.role==='assistant' ? '1px solid #1a1a30' : 'none',
              fontSize:14, lineHeight:1.7, color:'#e8e8f8',
            }} dangerouslySetInnerHTML={{ __html: renderMd(m.content) }} />
          </div>
        ))}

        {loading && (
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ width:26, height:26, borderRadius:7, background:'linear-gradient(135deg,#001a66,#0066ff)', border:'1px solid #0044cc', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:8, color:'#00d4ff' }}>N</div>
            <div style={{ background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:'14px 14px 14px 3px', padding:'12px 16px', display:'flex', gap:4, alignItems:'center' }}>
              {[0,0.15,0.3].map((d,i) => (
                <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'linear-gradient(135deg,#0066ff,#00d4ff)', animation:`dotbounce 0.7s ${d}s ease-in-out infinite alternate`, boxShadow:'0 0 5px #00d4ff88' }} />
              ))}
            </div>
          </div>
        )}

        {messages.length <= 1 && !loading && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:6 }}>
            {SUGG.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:20,
                padding:'6px 14px', fontSize:12, color:'#666688', cursor:'pointer',
                fontFamily:'var(--font-body)', transition:'all 0.2s',
              }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#00aeef44';e.currentTarget.style.color='#00aeef'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a30';e.currentTarget.style.color='#666688'}}
              >{s}</button>
            ))}
          </div>
        )}
        <div style={{ height:8 }} />
      </div>

      {/* Input */}
      <div style={{ padding:'12px 16px 16px', background:'#000', borderTop:'1px solid #0d0d1a' }}>
        <div style={{ display:'flex', gap:8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
            placeholder={listening ? 'Escuchando...' : 'Escribile a Neo...'}
            style={{ flex:1 }}
          />
          <button onClick={handleMic} style={{
            width:42, height:42, borderRadius:10, border:'none', flexShrink:0,
            background: listening ? 'rgba(248,113,113,0.15)' : '#0d0d1a',
            color: listening ? '#f87171' : '#666688',
            fontSize:17, display:'flex', alignItems:'center', justifyContent:'center',
            outline: listening ? '1px solid #f8717166' : '1px solid #1a1a30',
            animation: listening ? 'micpulse 1s infinite' : 'none',
          }}>🎙️</button>
          <button onClick={() => send()} disabled={!input.trim()||loading} style={{
            width:42, height:42, borderRadius:10, border:'none', flexShrink:0,
            background: input.trim()&&!loading ? 'linear-gradient(135deg,#0055cc,#3a6fff)' : '#0d0d1a',
            color: input.trim()&&!loading ? '#fff' : '#333355',
            fontSize:16, display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.2s',
          }}>▶</button>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:8 }}>
          <button onClick={() => setVoiceEnabled(v => !v)} style={{
            background:'none', border:'none',
            color: voiceEnabled ? '#00aeef' : '#333355',
            fontSize:11, fontFamily:'var(--font-mono)', cursor:'pointer', letterSpacing:'0.08em',
          }}>
            {voiceEnabled ? '🔊 VOZ ON' : '🔇 VOZ OFF'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dotbounce { 0%{transform:translateY(0)} 100%{transform:translateY(-5px)} }
        @keyframes micpulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
