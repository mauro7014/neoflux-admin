import { useState, useRef, useCallback, useEffect } from 'react'

export function useNeoSpeech(voiceEnabled) {
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        window.speechSynthesis.getVoices()
      })
    }
  }, [])

  const speak = useCallback((text) => {
    if (!window.speechSynthesis || !voiceEnabled) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/[#`~\[\]()_]/g, '')
      .replace(/\n+/g, '. ')
      .trim()
    const utt = new SpeechSynthesisUtterance(clean)
    utt.lang = 'es-AR'
    utt.rate = 1.05
    utt.pitch = 0.8
    utt.volume = 1
    const voices = window.speechSynthesis.getVoices()
    const male =
      voices.find(v => v.lang.startsWith('es') && /jorge|diego|carlos|pablo|miguel|male/i.test(v.name)) ||
      voices.find(v => v.lang.startsWith('es') && !v.name.toLowerCase().includes('female')) ||
      voices.find(v => v.lang.startsWith('es')) || null
    if (male) utt.voice = male
    utt.onstart = () => setSpeaking(true)
    utt.onend = () => setSpeaking(false)
    utt.onerror = () => setSpeaking(false)
    setTimeout(() => window.speechSynthesis.speak(utt), 80)
  }, [voiceEnabled])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  const startListening = useCallback((onResult, onError) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { onError?.('Usá Chrome para reconocimiento de voz.'); return }
    window.speechSynthesis?.cancel()
    setSpeaking(false)
    const rec = new SR()
    rec.lang = 'es-AR'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onstart = () => setListening(true)
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setListening(false)
      onResult(text)
    }
    rec.onerror = (e) => { setListening(false); onError?.('Error: ' + e.error) }
    rec.onend = () => setListening(false)
    recognitionRef.current = rec
    rec.start()
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  return { speaking, listening, speak, stopSpeaking, startListening, stopListening }
}
