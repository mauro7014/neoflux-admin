import { useState, useRef, useEffect, useCallback } from 'react'
import NeoAvatar from './NeoAvatar'
import { calcProject, formatDate, fmtMoney, daysUntil } from '../utils/calc'

const OWNER = 'Mauro'

const NEO_SYSTEM = `Sos Neo, el secretario privado y contador de Mauro en NeoFlux, empresa de desarrollo de software en Rosario, Argentina.

Personalidad: masculino, directo, confiable, humor seco. Rioplatense siempre (vos, tenés, hacés).
Usá el nombre Mauro solo cuando sea natural, no en cada mensaje.

Respondé como en una charla real: frases cortas y directas. Si es simple, 1-2 oraciones. Sin listas innecesarias. Máximo 1 emoji.

ESPECIALIDADES:
- PROYECTOS: fecha inicio + entrega + monto → días, ganancia diaria, tarifa por hora
- DOMINIOS: vencimientos y costos
- GASTOS: total mensual, rentabilidad
- CONTABILIDAD: ingresos vs gastos
- ASESORÍA: pricing, estimaciones`

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
  const [convMode, setConvMode] = useState(false)
  const chatRef = useRef(null)
  const inputRef = useRef(null)
  const initialized = useRef(false)
  const convModeRef = useRef(false)
  const recognitionRef = useRef(null)
  const isSpeakingRef = useRef(false)
  const messagesRef = useRef([])

  // Sincronizar mensajes con ref para usarlos en callbacks
  useEffect(() => { messagesRef.current = messages }, [messages])

  function buildContext() {
    let ctx = '\n\n--- DATOS ACTUALES ---'
    if (projects.length) {
      ctx += '\nPROYECTOS:\n'
      projects.forEach(p => {
        const { dias, diario, porHora, left } = calcProject(p)
        ctx += `• ${p.name}: ${formatDate(p.start)}→${formatDate(p.end)}, ${dias}d, ${p.currency||'USD'} ${fmtMoney(p.amount)}, $${fmtMoney(diario)}/día. Faltan ${left}d.\n`
      })
    } else ctx += '\nPROYECTOS: ninguno.'
    if (domains.length) {
      ctx += '\nDOMINIOS:\n'
      domains.forEach(d => {
        const left = daysUntil(d.renews)
        ctx += `• ${d.name}: vence ${formatDate(d.renews)} (${left}d)${left<60?' ⚠️':''}, ${d.currency||'USD'} ${d.renewCost||d.cost}\n`
      })
    }
    if (expenses.length) {
      ctx += '\nGASTOS:\n'
      let tot = 0
      expenses.forEach(e => {
        const f = e.frequency==='Anual'?1/12:e.frequency==='Único'?0:1
        tot += Number(e.amount)*f
        ctx += `• ${e.name}: ${e.currency} ${e.amount} ${e.frequency}\n`
      })
      ctx += `TOTAL/MES: $${fmtMoney(tot)}\n`
    } else ctx += '\nGASTOS: ninguno.'
    return ctx
  }

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    const greeting = { role:'assistant', content:`¡Hola Mauro! ¿En qué te ayudo?` }
    setMessages([greeting])
    messagesRef.current = [greeting]
    setTimeout(() => speak('¡Hola Mauro! ¿En qué te ayudo?'), 600)
  }, [])

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // ── Conversación continua real ──
  const startContinuousListen = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const rec = new SR()
    rec.lang = 'es-AR'
    rec.continuous = true        // clave: no para nunca
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onresult = (e) => {
      // Ignorar si Neo está hablando
      if (isSpeakingRef.current) return
      const text = e.results[e.results.length - 1][0].transcript.trim()
      if (text.length < 2) return
      sendMessage(text)
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return // ignorar silencio
      if (e.error === 'aborted') return
      // Reintentar en otros errores si sigue en modo conv
      if (convModeRef.current) {
        setTimeout(() => startContinuousListen(), 1000)
      }
    }

    rec.onend = () => {
      // Si sigue en modo conversación, reiniciar
      if (convModeRef.current) {
        setTimeout(() => startContinuousListen(), 500)
      }
    }

    recognitionRef.current = rec
    rec.start()
  }, [])

  const stopContinuousListen = useCallback(() => {
    try { recognitionRef.current?.stop() } catch {}
    recognitionRef.current = null
  }, [])

  function toggleConvMode() {
    const next = !convMode
    setConvMode(next)
    convModeRef.current = next
    if (next) {
      startContinuousListen()
    } else {
      stopContinuousListen()
    }
  }

  async function sendMessage(text) {
    if (!text.trim() || loading) return
    const userMsg = { role:'user', content: text }
    const newMsgs = [...messagesRef.current, userMsg]
    setMessages(newMsgs)
    messagesRef.current = newMsgs
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          system: NEO_SYSTEM + buildContext(),
          messages: newMsgs.map(m => ({ role:m.role, content:m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.map(b => b.text||'').join('') || 'No pude conectarme.'
      const assistantMsg = { role:'assistant', content: reply }
      setMessages(prev => [...prev, assistantMsg])
      messagesRef.current = [...newMsgs, assistantMsg]

      // Hablar — bloquear mic mientras habla
      if (voiceEnabled) {
        isSpeakingRef.current = true
        speak(reply)
        // Estimar duración de la respuesta
        const words = reply.split(' ').length
        const ms = Math.max(1500, words * 320)
        setTimeout(() => { isSpeakingRef.current = false }, ms)
      }
    } catch {
      const err = 'Error de conexión.'
      setMessages(prev => [...prev, { role:'assistant', content: err }])
      messagesRef.current = [...newMsgs, { role:'assistant', content: err }]
    }
    setLoading(false)
  }

  async function send() {
    await sendMessage(input)
  }

  function handleMic() {
    if (listening) { stopListening(); return }
    startListening(t => sendMessage(t), err => console.warn(err))
  }

  const SUGG = ['¿Cómo está la empresa?','¿Dominios por vencer?','¿Cuánto gasto por mes?','Calculá un proyecto']

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#000' }}>
      {/* Avatar */}
      <div style={{ padding:'20px 20px 12px', display:'flex', flexDirection:'column', alignItems:'center', borderBottom:'1px solid #0d0d1a', background:'#000', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.03, backgroundImage:'linear-gradient(#00aeef 1px,transparent 1px),linear-gradient(90deg,#00aeef 1px,transparent 1px)', backgroundSize:'28px 28px' }} />
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at center,transparent 40%,#000 85%)' }} />
        <div style={{ position:'relative', zIndex:1, width:'100%', display:'flex', justifyContent:'center' }}>
          <NeoAvatar speaking={speaking} listening={convMode || listening} />
        </div>
        {/* Botón conversación */}
        <button onClick={toggleConvMode} style={{
          marginTop:10, position:'relative', zIndex:1,
          background: convMode ? 'rgba(0,212,255,0.12)' : '#0d0d1a',
          border: convMode ? '1px solid #00d4ff66' : '1px solid #1a1a30',
          borderRadius:20, padding:'6px 20px',
          color: convMode ? '#00d4ff' : '#444466',
          fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'0.12em',
          cursor:'pointer', transition:'all 0.3s',
          boxShadow: convMode ? '0 0 16px #00d4ff33' : 'none',
          animation: convMode ? 'convpulse 2s ease-in-out infinite' : 'none',
        }}>
          {convMode ? '🔴 CONVERSANDO — tocá para parar' : '🎙️ ACTIVAR CONVERSACIÓN'}
        </button>
      </div>

      {/* Messages */}
      <div ref={chatRef} style={{ flex:1, overflowY:'auto', padding:'14px 16px 0', display:'flex', flexDirection:'column', gap:10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', gap:8 }}>
            {m.role === 'assistant' && (
              <div style={{ width:26, height:26, borderRadius:7, flexShrink:0, marginTop:2, background:'linear-gradient(135deg,#001a66,#0066ff)', border:'1px solid #0044cc', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-display)', fontSize:8, color:'#00d4ff' }}>N</div>
            )}
            <div style={{
              maxWidth:'82%', padding:'9px 13px',
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
            <div style={{ background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:'14px 14px 14px 3px', padding:'11px 16px', display:'flex', gap:4, alignItems:'center' }}>
              {[0,0.15,0.3].map((d,i) => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'linear-gradient(135deg,#0066ff,#00d4ff)', animation:`dotbounce 0.7s ${d}s ease-in-out infinite alternate`, boxShadow:'0 0 5px #00d4ff88' }} />)}
            </div>
          </div>
        )}
        {messages.length <= 1 && !loading && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:4 }}>
            {SUGG.map(s => (
              <button key={s} onClick={() => sendMessage(s)} style={{ background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:20, padding:'6px 14px', fontSize:12, color:'#666688', cursor:'pointer', fontFamily:'var(--font-body)' }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor='#00aeef44';e.currentTarget.style.color='#00aeef'}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor='#1a1a30';e.currentTarget.style.color='#666688'}}
              >{s}</button>
            ))}
          </div>
        )}
        <div style={{ height:8 }} />
      </div>

      {/* Input */}
      <div style={{ padding:'10px 16px 14px', background:'#000', borderTop:'1px solid #0d0d1a' }}>
        <div style={{ display:'flex', gap:8 }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
            placeholder={convMode ? '🎙️ Modo conversación activo — hablá nomás' : listening ? 'Escuchando...' : 'Escribile a Neo...'}
            disabled={convMode}
            style={{ flex:1, opacity: convMode ? 0.5 : 1 }}
          />
          {!convMode && <>
            <button onClick={handleMic} style={{ width:42, height:42, borderRadius:10, border:'none', flexShrink:0, background: listening ? 'rgba(248,113,113,0.15)' : '#0d0d1a', color: listening ? '#f87171' : '#666688', fontSize:17, display:'flex', alignItems:'center', justifyContent:'center', outline: listening ? '1px solid #f8717166' : '1px solid #1a1a30' }}>🎙️</button>
            <button onClick={send} disabled={!input.trim()||loading} style={{ width:42, height:42, borderRadius:10, border:'none', flexShrink:0, background: input.trim()&&!loading ? 'linear-gradient(135deg,#0055cc,#3a6fff)' : '#0d0d1a', color: input.trim()&&!loading ? '#fff' : '#333355', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>▶</button>
          </>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', marginTop:6 }}>
          <button onClick={() => setVoiceEnabled(v => !v)} style={{ background:'none', border:'none', color:voiceEnabled?'#00aeef':'#333355', fontSize:11, fontFamily:'var(--font-mono)', cursor:'pointer', letterSpacing:'0.08em' }}>
            {voiceEnabled ? '🔊 VOZ ON' : '🔇 VOZ OFF'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes dotbounce { 0%{transform:translateY(0)} 100%{transform:translateY(-5px)} }
        @keyframes convpulse { 0%,100%{box-shadow:0 0 16px #00d4ff33} 50%{box-shadow:0 0 28px #00d4ff66} }
      `}</style>
    </div>
  )
}
