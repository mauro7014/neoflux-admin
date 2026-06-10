import { useState } from 'react'
import { fmtMoney } from '../utils/calc'

const CATS = ['Hosting','Dominio','Herramienta','Suscripción','Software','Otro']
const FREQS = ['Mensual','Anual','Único']
const EMPTY = { name:'', category:'Hosting', amount:'', currency:'USD', frequency:'Mensual', dueDay:'', notes:'' }
const sCard = { background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:16, padding:'18px 20px', marginBottom:12 }
const sLbl = { fontSize:11, color:'#444466', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }
const sBox = { background:'#080810', borderRadius:10, padding:'10px 14px', border:'1px solid #111120' }
const sBP = { background:'linear-gradient(135deg,#0055cc,#3a6fff)', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:600, fontSize:14 }
const sBG = { background:'#111120', color:'#8888aa', border:'1px solid #1a1a30', borderRadius:10, padding:'9px 16px', fontSize:13 }
const CAT_ICONS = { Hosting:'🖥️', Dominio:'🌐', Herramienta:'🔧', Suscripción:'🔄', Software:'💻', Otro:'📦' }

export default function ExpensesPanel({ expenses, setExpenses }) {
  const [form, setForm] = useState(EMPTY)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  function sf(k,v) { setForm(f=>({...f,[k]:v})) }
  function save() {
    if (!form.name||!form.amount) return
    if (editId) { setExpenses(es=>es.map(e=>e.id===editId?{...form,id:editId,amount:Number(form.amount)}:e)); setEditId(null) }
    else setExpenses(es=>[...es,{...form,id:Date.now(),amount:Number(form.amount)}])
    setForm(EMPTY); setOpen(false)
  }
  function startEdit(e) { setForm({name:e.name,category:e.category||'Otro',amount:String(e.amount),currency:e.currency||'USD',frequency:e.frequency||'Mensual',dueDay:e.dueDay||'',notes:e.notes||''}); setEditId(e.id); setOpen(true) }
  function cancel() { setForm(EMPTY); setOpen(false); setEditId(null) }

  const monthly = expenses.reduce((acc,e) => {
    const factor = e.frequency==='Anual'?1/12:e.frequency==='Único'?0:1
    return acc + Number(e.amount)*factor
  }, 0)

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid #0d0d1a'}}>
        <div>
          <div style={{fontFamily:'var(--font-display)',fontSize:14,color:'#00aeef',letterSpacing:'0.1em'}}>GASTOS FIJOS</div>
          <div style={{fontSize:12,color:'#444466',marginTop:2}}>{expenses.length} registrado{expenses.length!==1?'s':''}</div>
        </div>
        <button style={sBP} onClick={()=>{cancel();setOpen(v=>!v)}}>+ Nuevo</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        {expenses.length>0&&(
          <div style={{...sCard,border:'1px solid #00aeef33',marginBottom:20}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:11,color:'#00aeef',letterSpacing:'0.12em',marginBottom:12}}>RESUMEN MENSUAL</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div style={sBox}><div style={sLbl}>💸 Total/mes</div><div style={{fontFamily:'var(--font-mono)',fontSize:16,fontWeight:700,color:'#f87171'}}>~${fmtMoney(monthly)}</div></div>
              <div style={sBox}><div style={sLbl}>📦 Items</div><div style={{fontFamily:'var(--font-mono)',fontSize:16,fontWeight:700}}>{expenses.length}</div></div>
            </div>
          </div>
        )}
        {open&&(
          <div style={{...sCard,border:'1px solid #00aeef33',marginBottom:20}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:12,color:'#00aeef',letterSpacing:'0.12em',marginBottom:16}}>{editId?'✎ EDITAR':'+ NUEVO GASTO'}</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><div style={sLbl}>Nombre</div><input placeholder="Ej: Railway hosting" value={form.name} onChange={e=>sf('name',e.target.value)}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><div style={sLbl}>Categoría</div><select value={form.category} onChange={e=>sf('category',e.target.value)}>{CATS.map(c=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}</select></div>
                <div><div style={sLbl}>Frecuencia</div><select value={form.frequency} onChange={e=>sf('frequency',e.target.value)}>{FREQS.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
                <div><div style={sLbl}>Moneda</div><select value={form.currency} onChange={e=>sf('currency',e.target.value)}><option value="USD">USD</option><option value="ARS">ARS</option><option value="EUR">EUR</option></select></div>
                <div><div style={sLbl}>Monto</div><input type="number" placeholder="0" value={form.amount} onChange={e=>sf('amount',e.target.value)}/></div>
                <div><div style={sLbl}>Día de pago</div><input type="number" placeholder="1-31" min="1" max="31" value={form.dueDay} onChange={e=>sf('dueDay',e.target.value)}/></div>
                <div><div style={sLbl}>Notas</div><input placeholder="Detalle..." value={form.notes} onChange={e=>sf('notes',e.target.value)}/></div>
              </div>
              <div style={{display:'flex',gap:8}}><button style={sBP} onClick={save}>{editId?'Actualizar':'Guardar'}</button><button style={sBG} onClick={cancel}>Cancelar</button></div>
            </div>
          </div>
        )}
        {expenses.length===0&&!open&&(
          <div style={{textAlign:'center',color:'#222240',padding:'60px 0'}}>
            <div style={{fontSize:48,marginBottom:12}}>💳</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:13,letterSpacing:'0.1em'}}>SIN GASTOS REGISTRADOS</div>
            <div style={{fontSize:12,color:'#333355',marginTop:6}}>Agregá hosting, dominios, suscripciones...</div>
          </div>
        )}
        {expenses.map(e=>{
          const factor = e.frequency==='Anual'?1/12:e.frequency==='Único'?0:1
          const mon = Number(e.amount)*factor
          return (
            <div key={e.id} style={sCard}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                <div><div style={{fontWeight:700,fontSize:15}}>{CAT_ICONS[e.category||'Otro']} {e.name}</div>{e.notes&&<div style={{fontSize:12,color:'#444466',marginTop:2}}>{e.notes}</div>}</div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{background:'rgba(91,143,255,0.15)',color:'#5b8fff',border:'1px solid rgba(91,143,255,0.3)',borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,fontFamily:'var(--font-mono)'}}>{e.frequency}</span>
                  <button onClick={()=>startEdit(e)} style={{background:'none',border:'none',color:'#444466',fontSize:15,padding:'2px 6px'}}>✎</button>
                  <button onClick={()=>setExpenses(es=>es.filter(x=>x.id!==e.id))} style={{background:'none',border:'none',color:'#333355',fontSize:18,padding:'2px 6px'}}>×</button>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <div style={sBox}><div style={sLbl}>💰 Monto</div><div style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:700}}>{e.currency} {fmtMoney(e.amount)}</div></div>
                <div style={sBox}><div style={sLbl}>📅 /mes equiv.</div><div style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:700,color:mon>0?'#f87171':'#444466'}}>{mon>0?`~$${fmtMoney(mon)}`:'—'}</div></div>
              </div>
              {e.dueDay&&<div style={{fontSize:12,color:'#444466',marginTop:10}}>Vence día {e.dueDay} de cada mes</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
