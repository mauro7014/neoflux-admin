import { useState } from 'react'
import { calcProject, formatDate, fmtMoney, daysBetween } from '../utils/calc'

const EMPTY = { name:'', start:'', end:'', amount:'', currency:'USD', hours:'8', notes:'' }
const sCard = { background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:16, padding:'18px 20px', marginBottom:12 }
const sLbl = { fontSize:11, color:'#444466', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }
const sBox = { background:'#080810', borderRadius:10, padding:'10px 14px', border:'1px solid #111120' }
const sBP = { background:'linear-gradient(135deg,#0055cc,#3a6fff)', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:600, fontSize:14 }
const sBG = { background:'#111120', color:'#8888aa', border:'1px solid #1a1a30', borderRadius:10, padding:'9px 16px', fontSize:13 }

export default function ProjectsPanel({ projects, setProjects }) {
  const [form, setForm] = useState(EMPTY)
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  function sf(k,v) { setForm(f=>({...f,[k]:v})) }
  function save() {
    if (!form.name||!form.start||!form.end||!form.amount) return
    if (editId) { setProjects(ps=>ps.map(p=>p.id===editId?{...form,id:editId,amount:Number(form.amount)}:p)); setEditId(null) }
    else setProjects(ps=>[...ps,{...form,id:Date.now(),amount:Number(form.amount)}])
    setForm(EMPTY); setOpen(false)
  }
  function startEdit(p) { setForm({name:p.name,start:p.start,end:p.end,amount:String(p.amount),currency:p.currency||'USD',hours:String(p.hours||8),notes:p.notes||''}); setEditId(p.id); setOpen(true) }
  function cancel() { setForm(EMPTY); setOpen(false); setEditId(null) }
  const prev = form.start&&form.end&&form.amount ? (() => { const d=daysBetween(form.start,form.end); if(d<=0) return null; const a=Number(form.amount),h=Number(form.hours)||8; return {d,di:a/d,ph:a/(d*h)} })() : null

  return (
    <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 20px',borderBottom:'1px solid #0d0d1a'}}>
        <div>
          <div style={{fontFamily:'var(--font-display)',fontSize:14,color:'#00aeef',letterSpacing:'0.1em'}}>PROYECTOS</div>
          <div style={{fontSize:12,color:'#444466',marginTop:2}}>{projects.length} registrado{projects.length!==1?'s':''}</div>
        </div>
        <button style={sBP} onClick={()=>{cancel();setOpen(v=>!v)}}>+ Nuevo</button>
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        {open&&(
          <div style={{...sCard,border:'1px solid #00aeef33',marginBottom:20}}>
            <div style={{fontFamily:'var(--font-display)',fontSize:12,color:'#00aeef',letterSpacing:'0.12em',marginBottom:16}}>{editId?'✎ EDITAR':'+ NUEVO PROYECTO'}</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><div style={sLbl}>Nombre</div><input placeholder="Ej: Replastexpress v2" value={form.name} onChange={e=>sf('name',e.target.value)}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div><div style={sLbl}>Inicio</div><input type="date" value={form.start} onChange={e=>sf('start',e.target.value)}/></div>
                <div><div style={sLbl}>Entrega</div><input type="date" value={form.end} onChange={e=>sf('end',e.target.value)}/></div>
                <div><div style={sLbl}>Moneda</div><select value={form.currency} onChange={e=>sf('currency',e.target.value)}><option value="USD">USD</option><option value="ARS">ARS</option><option value="EUR">EUR</option></select></div>
                <div><div style={sLbl}>Monto total</div><input type="number" placeholder="0" value={form.amount} onChange={e=>sf('amount',e.target.value)}/></div>
                <div><div style={sLbl}>Horas/día</div><select value={form.hours} onChange={e=>sf('hours',e.target.value)}>{[4,5,6,7,8,9,10,12].map(h=><option key={h} value={h}>{h}h/día</option>)}</select></div>
                <div><div style={sLbl}>Notas</div><input placeholder="Cliente, tech..." value={form.notes} onChange={e=>sf('notes',e.target.value)}/></div>
              </div>
              {prev&&<div style={{background:'rgba(0,174,239,0.06)',border:'1px solid rgba(0,174,239,0.2)',borderRadius:10,padding:'12px 16px',display:'flex',gap:20,flexWrap:'wrap'}}>
                <span style={{color:'#00aeef',fontSize:13}}>📅 <strong>{prev.d}</strong> días</span>
                <span style={{color:'#00d4ff',fontSize:13}}>💰 <strong>{form.currency} {fmtMoney(prev.di)}</strong>/día</span>
                <span style={{color:'#39ff14',fontSize:13}}>⏱️ <strong>{form.currency} {fmtMoney(prev.ph)}</strong>/hora</span>
              </div>}
              <div style={{display:'flex',gap:8}}><button style={sBP} onClick={save}>{editId?'Actualizar':'Guardar'}</button><button style={sBG} onClick={cancel}>Cancelar</button></div>
            </div>
          </div>
        )}
        {projects.length===0&&!open&&<div style={{textAlign:'center',color:'#222240',padding:'60px 0'}}><div style={{fontSize:48,marginBottom:12}}>📁</div><div style={{fontFamily:'var(--font-display)',fontSize:13,letterSpacing:'0.1em'}}>SIN PROYECTOS</div></div>}
        {projects.map(p=>{
          const {dias,diario,porHora,left,pct}=calcProject(p); const cur=p.currency||'USD'
          const tc=left<0?'#f87171':left<7?'#fb923c':left<30?'#fbbf24':'#39ff14'
          const tl=left<0?`Venció hace ${Math.abs(left)}d`:left===0?'¡Hoy!':`${left}d restantes`
          return (
            <div key={p.id} style={sCard}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
                <div><div style={{fontWeight:700,fontSize:16}}>{p.name}</div>{p.notes&&<div style={{fontSize:12,color:'#444466',marginTop:3}}>{p.notes}</div>}</div>
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{background:`${tc}18`,color:tc,border:`1px solid ${tc}44`,borderRadius:20,padding:'3px 10px',fontSize:11,fontWeight:700,fontFamily:'var(--font-mono)'}}>{tl}</span>
                  <button onClick={()=>startEdit(p)} style={{background:'none',border:'none',color:'#444466',fontSize:15,padding:'2px 6px'}}>✎</button>
                  <button onClick={()=>setProjects(ps=>ps.filter(x=>x.id!==p.id))} style={{background:'none',border:'none',color:'#333355',fontSize:18,padding:'2px 6px'}}>×</button>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                {[['TOTAL',`${cur} ${fmtMoney(p.amount)}`],['POR DÍA',`${cur} ${fmtMoney(diario)}`],['POR HORA',`${cur} ${fmtMoney(porHora)}`],['DÍAS',`${dias}d·${p.hours}h`]].map(([l,v])=>(
                  <div key={l} style={sBox}><div style={sLbl}>{l}</div><div style={{fontFamily:'var(--font-mono)',fontWeight:700,fontSize:12}}>{v}</div></div>
                ))}
              </div>
              <div style={{fontSize:12,color:'#444466',marginBottom:10}}>{formatDate(p.start)} → {formatDate(p.end)}</div>
              <div style={{height:3,background:'#111120',borderRadius:4}}><div style={{height:'100%',width:`${pct}%`,borderRadius:4,background:left>=7?'linear-gradient(90deg,#0066ff,#00d4ff)':'#fb923c',transition:'width 0.6s'}}/></div>
              <div style={{fontSize:11,color:'#333355',marginTop:4}}>{Math.round(pct)}% transcurrido</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
