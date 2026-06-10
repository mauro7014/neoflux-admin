import { useState, useRef, useCallback, useEffect } from 'react'

export function useNeoSpeech(voiceEnabled) {
  const [speaking, setSpeaking] = useState(false)
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const voicesRef = useRef([])

  useEffect(() => {
    function loadVoices() {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    loadVoices()
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
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
    utt.rate = 0.92
    utt.pitch = 0.5
    utt.volume = 1

    const voices = voicesRef.current
    const male =
      voices.find(v => v.lang.startsWith('es') && /jorge|diego|carlos|pablo|miguel/i.test(v.name)) ||
      voices.find(v => v.lang === 'es-AR') ||
      voices.find(v => v.lang === 'es-ES' && !v.name.toLowerCase().includes('female')) ||
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
