import { useState, useEffect } from 'react'
import NeoChat from './components/NeoChat'
import ProjectsPanel from './components/ProjectsPanel'
import DomainsPanel from './components/DomainsPanel'
import { useNeoSpeech } from './hooks/useNeoSpeech'
import { loadStorage, saveStorage, daysUntil } from './utils/calc'

const TABS = [
  { id:'neo', icon:'⚡', label:'NEO' },
  { id:'projects', icon:'📁', label:'PROYECTOS' },
  { id:'domains', icon:'🌐', label:'DOMINIOS' },
]

export default function App() {
  const [tab, setTab] = useState('neo')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [projects, setProjects] = useState(()=>loadStorage('nf_projects',[]))
  const [domains, setDomains] = useState(()=>loadStorage('nf_domains',[]))
  const { speaking, listening, speak, stopSpeaking, startListening, stopListening } = useNeoSpeech(voiceEnabled)
  useEffect(()=>{ saveStorage('nf_projects',projects) },[projects])
  useEffect(()=>{ saveStorage('nf_domains',domains) },[domains])
  const dA=domains.filter(d=>daysUntil(d.renews)<30&&daysUntil(d.renews)>=0).length
  const pA=projects.filter(p=>daysUntil(p.end)<7&&daysUntil(p.end)>=0).length
  const tA=dA+pA

  return (
    <div style={{height:'100dvh',background:'#000',display:'flex',flexDirection:'column',overflow:'hidden'}}>
      <div style={{height:52,background:'#000',borderBottom:'1px solid #0d0d1a',display:'flex',alignItems:'center',padding:'0 16px',gap:12,flexShrink:0}}>
        <img src="/logo.jpg" alt="NeoFlux" style={{width:30,height:30,borderRadius:8,objectFit:'cover'}}/>
        <div style={{fontFamily:'var(--font-display)',fontSize:13,color:'#e8e8f8',letterSpacing:'0.15em'}}>
          NEO<span style={{color:'#00aeef'}}>FLUX</span><span style={{fontSize:9,color:'#333355',marginLeft:4}}>ADMIN</span>
        </div>
        <div style={{flex:1}}/>
        {tA>0&&<div style={{background:'rgba(251,146,60,0.15)',border:'1px solid rgba(251,146,60,0.4)',color:'#fb923c',borderRadius:20,padding:'3px 10px',fontSize:11,fontFamily:'var(--font-mono)',fontWeight:700,animation:'alertpulse 2s ease-in-out infinite'}}>⚠ {tA} ALERTA{tA>1?'S':''}</div>}
        {speaking&&<div style={{display:'flex',gap:2,alignItems:'center'}}>{[0,0.1,0.2].map((d,i)=><div key={i} style={{width:3,height:12,background:'#00d4ff',borderRadius:2,animation:`topwave 0.6s ${d}s ease-in-out infinite alternate`,boxShadow:'0 0 4px #00d4ff'}}/>)}</div>}
      </div>

      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{flex:1,overflow:'hidden'}}>
          {tab==='neo'&&<NeoChat projects={projects} domains={domains} speak={speak} speaking={speaking} listening={listening} startListening={startListening} stopListening={stopListening} voiceEnabled={voiceEnabled} setVoiceEnabled={setVoiceEnabled}/>}
          {tab==='projects'&&<ProjectsPanel projects={projects} setProjects={setProjects}/>}
          {tab==='domains'&&<DomainsPanel domains={domains} setDomains={setDomains}/>}
        </div>
        <div style={{display:'flex',background:'#000',borderTop:'1px solid #0d0d1a',flexShrink:0}}>
          {TABS.map(t=>{
            const isA=tab===t.id
            const badge=t.id==='domains'?dA:t.id==='projects'?pA:0
            return (
              <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,background:'none',border:'none',padding:'10px 8px 12px',display:'flex',flexDirection:'column',alignItems:'center',gap:4,cursor:'pointer',position:'relative'}}>
                <div style={{position:'absolute',top:0,left:'20%',right:'20%',height:2,borderRadius:'0 0 3px 3px',background:isA?'#00aeef':'transparent',boxShadow:isA?'0 0 8px #00aeef':'none',transition:'all 0.2s'}}/>
                <div style={{fontSize:20,filter:isA?'drop-shadow(0 0 6px #00aeef)':'grayscale(0.8) brightness(0.5)',transition:'filter 0.2s'}}>{t.icon}</div>
                <div style={{fontFamily:'var(--font-display)',fontSize:8,letterSpacing:'0.15em',color:isA?'#00aeef':'#333355',transition:'color 0.2s'}}>{t.label}</div>
                {badge>0&&<div style={{position:'absolute',top:6,right:'22%',width:14,height:14,borderRadius:'50%',background:'#fb923c',color:'#000',fontSize:8,fontWeight:900,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-mono)'}}>{badge}</div>}
              </button>
            )
          })}
        </div>
      </div>
      <style>{`
        @keyframes alertpulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes topwave { 0%{height:3px} 100%{height:14px} }
      `}</style>
    </div>
  )
}
