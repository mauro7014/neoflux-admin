export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { messages, system } = req.body

  try {
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system }] },
          contents,
          generationConfig: { maxOutputTokens: 512, temperature: 0.7 }
        }),
      }
    )
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude responder.'
    res.status(200).json({ content: [{ text }] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
