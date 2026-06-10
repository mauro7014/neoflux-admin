import { useState } from 'react'
import { fmtMoney, calcProject, daysUntil } from '../utils/calc'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function exportToCSV(projects, domains, expenses) {
  const rows = []
  const sep = ','
  const now = new Date().toLocaleDateString('es-AR')

  rows.push(['NEOFLUX - CONTABILIDAD', now])
  rows.push([])

  rows.push(['=== PROYECTOS ==='])
  rows.push(['Nombre','Moneda','Monto','Inicio','Entrega','Días','Por Día','Por Hora','Estado'])
  projects.forEach(p => {
    const {dias,diario,porHora,left} = calcProject(p)
    const estado = left < 0 ? 'Vencido' : left === 0 ? 'Hoy' : `${left}d restantes`
    rows.push([p.name, p.currency||'USD', p.amount, p.start, p.end, dias, diario.toFixed(2), porHora.toFixed(2), estado])
  })
  if (!projects.length) rows.push(['Sin proyectos registrados'])
  rows.push([])

  rows.push(['=== DOMINIOS ==='])
  rows.push(['Dominio','Moneda','Costo Renovación','Vencimiento','Días Restantes'])
  domains.forEach(d => {
    const left = daysUntil(d.renews)
    rows.push([d.name, d.currency||'USD', d.renewCost||d.cost, d.renews, left])
  })
  rows.push([])

  rows.push(['=== GASTOS FIJOS ==='])
  rows.push(['Nombre','Categoría','Moneda','Monto','Frecuencia','Equiv. Mensual'])
  let totalMes = 0
  expenses.forEach(e => {
    const factor = e.frequency==='Anual'?1/12:e.frequency==='Único'?0:1
    const monthly = Number(e.amount)*factor
    totalMes += monthly
    rows.push([e.name, e.category, e.currency||'USD', e.amount, e.frequency, monthly.toFixed(2)])
  })
  rows.push(['','','','','TOTAL MENSUAL', totalMes.toFixed(2)])
  rows.push([])

  const totalIngresos = projects.reduce((a,p) => a + Number(p.amount), 0)
  rows.push(['=== RESUMEN EJECUTIVO ==='])
  rows.push(['Ingresos proyectos activos', totalIngresos.toFixed(2)])
  rows.push(['Gastos mensuales', totalMes.toFixed(2)])
  rows.push(['Ganancia neta estimada', (totalIngresos - totalMes).toFixed(2)])

  const csv = rows.map(r => r.map(c => `"${String(c||'').replace(/"/g,'""')}"`).join(sep)).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `neoflux-contabilidad-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function BarChart({ projects, expenses }) {
  const currentMonth = new Date().getMonth()
  const bars = MONTHS.map((m, i) => {
    const income = projects
      .filter(p => new Date(p.end + 'T12:00:00').getMonth() === i)
      .reduce((a, p) => a + Number(p.amount), 0)
    const monthlyExp = expenses.reduce((acc, e) => {
      const factor = e.frequency==='Anual'?1/12:e.frequency==='Único'?0:1
      return acc + Number(e.amount)*factor
    }, 0)
    const expense = monthlyExp
    return { m, income, expense, isCurrent: i === currentMonth }
  })

  const maxVal = Math.max(...bars.map(b => Math.max(b.income, b.expense)), 100)

  return (
    <div style={{ padding:'0 4px' }}>
      <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:120, marginBottom:8 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, height:'100%', justifyContent:'flex-end' }}>
            <div style={{ width:'100%', display:'flex', gap:1, alignItems:'flex-end', height:'100%' }}>
              {/* Income bar */}
              <div style={{
                flex:1, borderRadius:'3px 3px 0 0', minHeight:2,
                height: `${Math.max(2, (b.income/maxVal)*100)}%`,
                background: b.isCurrent
                  ? 'linear-gradient(to top, #0066ff, #00d4ff)'
                  : b.income > 0
                  ? 'linear-gradient(to top, #003399, #0066ff)'
                  : '#1a1a30',
                boxShadow: b.isCurrent && b.income > 0 ? '0 0 8px #00d4ff66' : 'none',
                transition: 'height 0.6s ease',
              }} />
              {/* Expense bar */}
              <div style={{
                flex:1, borderRadius:'3px 3px 0 0', minHeight:2,
                height: `${Math.max(2, (b.expense/maxVal)*100)}%`,
                background: b.expense > 0
                  ? 'linear-gradient(to top, #660000, #f87171)'
                  : '#1a1a30',
                transition: 'height 0.6s ease',
              }} />
            </div>
          </div>
        ))}
      </div>
      {/* Base */}
      <div style={{ height:1, background:'linear-gradient(90deg,transparent,#1a1a40,transparent)', marginBottom:6 }} />
      {/* Labels */}
      <div style={{ display:'flex', gap:4 }}>
        {bars.map((b,i) => (
          <div key={i} style={{ flex:1, textAlign:'center', fontSize:8, color: b.isCurrent?'#00aeef':'#333355', fontFamily:'var(--font-mono)', fontWeight: b.isCurrent?700:400 }}>{b.m}</div>
        ))}
      </div>
      {/* Legend */}
      <div style={{ display:'flex', gap:16, marginTop:10, justifyContent:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#8888aa' }}>
          <div style={{ width:10, height:10, borderRadius:2, background:'linear-gradient(to top,#003399,#0066ff)' }}/>
          Ingresos
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'#8888aa' }}>
          <div style={{ width:10, height:10, borderRadius:2, background:'linear-gradient(to top,#660000,#f87171)' }}/>
          Gastos
        </div>
      </div>
    </div>
  )
}

export default function AccountingPanel({ projects, domains, expenses }) {
  const [saved, setSaved] = useState(false)

  const totalIngresos = projects.reduce((a,p) => a + Number(p.amount), 0)
  const totalGastosMes = expenses.reduce((acc,e) => {
    const factor = e.frequency==='Anual'?1/12:e.frequency==='Único'?0:1
    return acc + Number(e.amount)*factor
  }, 0)
  const totalGastosAnual = totalGastosMes * 12
  const gananciaEst = totalIngresos - totalGastosMes
  const totalDominios = domains.reduce((a,d) => a + Number(d.renewCost||d.cost||0), 0)

  function handleExport() {
    exportToCSV(projects, domains, expenses)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const sCard = { background:'#0d0d1a', border:'1px solid #1a1a30', borderRadius:16, padding:'18px 20px', marginBottom:12 }
  const sLbl = { fontSize:11, color:'#444466', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.08em' }
  const sBox = { background:'#080810', borderRadius:10, padding:'10px 14px', border:'1px solid #111120' }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'16px 20px', borderBottom:'1px solid #0d0d1a', flexShrink:0 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:14, color:'#00aeef', letterSpacing:'0.1em' }}>CONTABILIDAD</div>
        <div style={{ fontSize:12, color:'#444466', marginTop:2 }}>Resumen ejecutivo NeoFlux</div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>

        {/* KPIs */}
        <div style={{ ...sCard, border:'1px solid #00aeef33' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'#00aeef', letterSpacing:'0.12em', marginBottom:14 }}>📊 RESUMEN EJECUTIVO</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
            <div style={sBox}>
              <div style={sLbl}>💰 Ingresos activos</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color:'#39ff14' }}>${fmtMoney(totalIngresos)}</div>
            </div>
            <div style={sBox}>
              <div style={sLbl}>💸 Gastos/mes</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color:'#f87171' }}>~${fmtMoney(totalGastosMes)}</div>
            </div>
            <div style={sBox}>
              <div style={sLbl}>📈 Ganancia estimada</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color: gananciaEst >= 0 ? '#00d4ff' : '#f87171' }}>${fmtMoney(gananciaEst)}</div>
            </div>
            <div style={sBox}>
              <div style={sLbl}>🌐 Dominios/año</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:15, fontWeight:700, color:'#fbbf24' }}>${fmtMoney(totalDominios)}</div>
            </div>
          </div>

          {/* Proyectos detalle */}
          {projects.length > 0 && (
            <div style={{ marginTop:4 }}>
              <div style={{ fontSize:11, color:'#333355', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>Proyectos activos</div>
              {projects.map(p => {
                const {diario,left} = calcProject(p)
                return (
                  <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #111120' }}>
                    <span style={{ fontSize:13, color:'#8888aa' }}>{p.name}</span>
                    <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                      <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'#e8e8f8' }}>{p.currency} {fmtMoney(p.amount)}</span>
                      <span style={{ fontSize:11, color: left<7?'#fb923c':'#444466' }}>{left}d</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {!projects.length && <div style={{ fontSize:12, color:'#333355', textAlign:'center', padding:'12px 0' }}>Sin proyectos registrados</div>}
        </div>

        {/* Grafico */}
        <div style={{ ...sCard, border:'1px solid #1a1a40' }}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'#00aeef', letterSpacing:'0.12em', marginBottom:16 }}>📉 PROGRESO ANUAL</div>
          <BarChart projects={projects} expenses={expenses} />
        </div>

        {/* Gastos detalle */}
        {expenses.length > 0 && (
          <div style={sCard}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'#00aeef', letterSpacing:'0.12em', marginBottom:12 }}>💳 GASTOS FIJOS DETALLE</div>
            {expenses.map(e => {
              const factor = e.frequency==='Anual'?1/12:e.frequency==='Único'?0:1
              const monthly = Number(e.amount)*factor
              return (
                <div key={e.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #111120' }}>
                  <span style={{ fontSize:13, color:'#8888aa' }}>{e.name} <span style={{ fontSize:10, color:'#333355' }}>({e.frequency})</span></span>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'#e8e8f8' }}>{e.currency} {fmtMoney(e.amount)}</div>
                    {monthly > 0 && <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'#f87171' }}>~${fmtMoney(monthly)}/mes</div>}
                  </div>
                </div>
              )
            })}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', marginTop:4 }}>
              <span style={{ fontSize:13, fontWeight:700, color:'#e8e8f8' }}>TOTAL MENSUAL</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'#f87171' }}>~${fmtMoney(totalGastosMes)}</span>
            </div>
          </div>
        )}

        {/* Dominios detalle */}
        <div style={sCard}>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, color:'#00aeef', letterSpacing:'0.12em', marginBottom:12 }}>🌐 DOMINIOS - COSTOS RENOVACIÓN</div>
          {domains.map(d => {
            const left = daysUntil(d.renews)
            const tc = left < 60 ? '#fbbf24' : '#444466'
            return (
              <div key={d.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #111120' }}>
                <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'#8888aa' }}>{d.name}</span>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'#e8e8f8' }}>{d.currency||'USD'} {fmtMoney(d.renewCost||d.cost||0)}</div>
                  <div style={{ fontSize:10, color:tc }}>{left}d restantes</div>
                </div>
              </div>
            )
          })}
          <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0 0', marginTop:4 }}>
            <span style={{ fontSize:13, fontWeight:700, color:'#e8e8f8' }}>TOTAL RENOVACIONES</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:'#fbbf24' }}>${fmtMoney(totalDominios)}</span>
          </div>
        </div>

        {/* Export button */}
        <button onClick={handleExport} style={{
          width:'100%', padding:'16px', borderRadius:14, border:'none',
          background: saved ? 'linear-gradient(135deg,#006600,#39ff14)' : 'linear-gradient(135deg,#0055cc,#3a6fff)',
          color:'#fff', fontFamily:'var(--font-display)', fontSize:13,
          letterSpacing:'0.1em', fontWeight:700, cursor:'pointer',
          boxShadow: saved ? '0 0 20px #39ff1444' : '0 0 20px #3a6fff44',
          transition:'all 0.3s', marginBottom:20,
        }}>
          {saved ? '✅ GUARDADO EN CSV' : '💾 GUARDAR EN EXCEL / CSV'}
        </button>

      </div>
    </div>
  )
}
