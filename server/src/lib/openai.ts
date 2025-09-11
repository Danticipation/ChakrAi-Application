const KEY = process.env.OPENAI_API_KEY ?? '';
type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

export async function chatCompletions(messages: Msg[], model = 'gpt-4o'): Promise<string> {
  if (!KEY) throw Object.assign(new Error('OPENAI_API_KEY missing'), { status: 503 });
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: 800, temperature: 0.7 })
  });
  if (!r.ok) throw Object.assign(new Error(`OpenAI chat ${r.status}`), { status: r.status });
  const j = await r.json();
  return j.choices?.[0]?.message?.content ?? '';
}

export async function transcribeWithWhisperWebm(file: Buffer, mime: string): Promise<string> {
  if (!KEY) throw Object.assign(new Error('OPENAI_API_KEY missing'), { status: 503 });
  const fd = new FormData();
  fd.append('file', new Blob([new Uint8Array(file)], { type: mime }), 'audio.webm');
  fd.append('model', 'whisper-1');
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}` }, body: fd
  });
  if (!r.ok) throw Object.assign(new Error(`OpenAI transcribe ${r.status}`), { status: r.status });
  const j = await r.json();
  return j.text as string;
}
