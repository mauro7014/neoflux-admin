import { useState } from 'react'
import { formatDate, daysUntil, fmtMoney } from '../utils/calc'

const EMPTY = { name:'', registrar:'', bought:'', renews:'', cost:'', renewCost:'', notes:'' }
const sCard = { background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:16, padding:'18px 20px', marginBottom:12 }
const sLbl = { fontSize:11, color:'#444466', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }
const sBox = { background:'#080810', borderRadius:10, padding:'10px 14px', border:'1px solid #111120' }
const sBP = { background:'linear-gradient(135deg,#0055cc,#3a6fff)', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:600, fontSize:14 }
const sBG = { background:'#111120', color:'#8888aa', border:'1px solid #1a1a30', borderRadius:10, padding:'9px 16px', fontSize:13 }

export default function DomainsPanel({ domains, setDomains }) {
  const [form, setForm] = useState(EMPTY)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  function sf(k,v) { setForm(f=>({...f,[k]:v})) }
  function save() {
    if (!form.name||!form.renews) return
    if (editId) { setDomains(ds=>ds.map(d=>d.id===editId?{...form,id:editId}:d)); setEditId(null) }
    else setDomains(ds=>[...ds,{...form,id:Date.now()}])
    setForm(EMPTY); setOpen(false)
  }
  function startEdit(d) { setForm({name:d.name,registrar:d.registrar||'',bought:d.bought||'',renews:d.renews,cost:String(d.cost||''),renewCost:String(d.renewCost||''),notes:d.notes||''}); setEditId(d.id); setOpen(true) }
  function cancel() { setForm(EMPTY); setOpen(false); setEditId(null) }
  const sorted=[...domains].sort((a,b)=>daysUntil(a.renews)-daysUntil(b.renews))

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid #0d0d1a'}}>
        <div>
          <div style={{fontFamily:'var(--font-display)',fontSize:14,color:'#00aeef',letterSpacing:'0.1em'}}>DOMINIOS</div>
          <div style={{fontSize:12,color:'#444466',marginTop:2}}>{domains.length} registrado{domains.length!==1?'s':''}</div>
        </div>
        <button style={sBP} onClick={()=>{cancel();setOpen(v=>!v)}}>+ Nuevo</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        {open&&(
          <div style={{...sCard,border:'1px solid #00aeef33',marginBottom:20}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:12,color:'#00aeef',letterSpacing:'0.12em',marginBottom:16}}>{editId?'✎ EDITAR':'+ NUEVO DOMINIO'}</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><div style={sLbl}>Dominio</div><input placeholder="midominio.com" value={form.name} onChange={e=>sf('name',e.target.value)}/></div>
                <div><div style={sLbl}>Registrador</div><input placeholder="Namecheap..." value={form.registrar} onChange={e=>sf('registrar',e.target.value)}/></div>
                <div><div style={sLbl}>Fecha compra</div><input type="date" value={form.bought} onChange={e=>sf('bought',e.target.value)}/></div>
                <div><div style={sLbl}>Fecha renovación</div><input type="date" value={form.renews} onChange={e=>sf('renews',e.target.value)}/></div>
                <div><div style={sLbl}>Costo original (USD)</div><input type="number" placeholder="0" value={form.cost} onChange={e=>sf('cost',e.target.value)}/></div>
                <div><div style={sLbl}>Costo renovación (USD)</div><input type="number" placeholder="0" value={form.renewCost} onChange={e=>sf('renewCost',e.target.value)}/></div>
              </div>
              <div><div style={sLbl}>Notas</div><input placeholder="Proyecto, hosting..." value={form.notes} onChange={e=>sf('notes',e.target.value)}/></div>
              <div style={{display:'flex',gap:8}}><button style={sBP} onClick={save}>{editId?'Actualizar':'Guardar'}</button><button style={sBG} onClick={cancel}>Cancelar</button></div>
            </div>
          </div>
        )}
        {domains.length===0&&!open&&<div style={{textAlign:'center',color:'#222240',padding:'60px 0'}}><div style={{fontSize:48,marginBottom:12}}>🌐</div><div style={{fontFamily:'var(--font-display)',fontSize:13,letterSpacing:'0.1em'}}>SIN DOMINIOS</div></div>}
        {sorted.map(d=>{
          const left=daysUntil(d.renews)
          const isExp=left<0,isUrg=left>=0&&left<15,isWarn=left>=15&&left<30
          const tc=isExp?'#f87171':isUrg?'#fb923c':isWarn?'#fbbf24':'#39ff14'
          const tl=isExp?`Venció hace ${Math.abs(left)}d`:left===0?'¡Vence hoy!':`${left}d para renovar`
          return (
            <div key={d.id} style={{...sCard,background:isUrg||isExp?`${tc}08`:sCard.background,borderColor:isExp?'#f8717144':isUrg?'#fb923c44':'#1a1a30'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                <div>
                  <div style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:16}}>{d.name}</div>
                  {d.registrar&&<div style={{fontSize:12,color:'#444466',marginTop:2}}>{d.registrar}</div>}
                  {d.notes&&<div style={{fontSize:12,color:'#333355',marginTop:2}}>{d.notes}</div>}
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{background:`${tc}18`,color:tc,border:`1px solid ${tc}44`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,fontFamily:'var(--font-mono)',boxShadow:isUrg||isExp?`0 0 10px ${tc}44`:'none'}}>{tl}</span>
                  <button onClick={()=>startEdit(d)} style={{background:'none',border:'none',color:'#444466',fontSize:15,padding:'2px 6px'}}>✎</button>
                  <button onClick={()=>setDomains(ds=>ds.filter(x=>x.id!==d.id))} style={{background:'none',border:'none',color:'#333355',fontSize:18,padding:'2px 6px'}}>×</button>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                <div style={sBox}><div style={sLbl}>🗓️ Renueva</div><div style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:600,color:tc}}>{formatDate(d.renews)}</div></div>
                <div style={sBox}><div style={sLbl}>💳 Renovación</div><div style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:700}}>{d.renewCost?`USD ${fmtMoney(d.renewCost)}`:'—'}</div></div>
                <div style={sBox}><div style={sLbl}>🛒 Original</div><div style={{fontFamily:'var(--font-mono)',fontSize:13,color:'#666688'}}>{d.cost?`USD ${fmtMoney(d.cost)}`:'—'}</div></div>
              </div>
              {d.bought&&<div style={{fontSize:11,color:'#333355',marginTop:10}}>Comprado: {formatDate(d.bought)}</div>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
