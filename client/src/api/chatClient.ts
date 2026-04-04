import type { ChatRequest, ChatResponse } from '@shared/chat.types';

export async function sendChat(userId: number, body: ChatRequest): Promise<ChatResponse> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-user-id': String(userId) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
  return res.json();
}

export async function transcribe(userId: number, file: File) {
  const fd = new FormData();
  fd.append('audio', file, file.name);
  const res = await fetch('/api/chat/transcribe', {
    method: 'POST',
    headers: { 'x-user-id': String(userId) },
    body: fd,
  });
  if (!res.ok) throw new Error(`Transcribe failed: ${res.status}`);
  return res.json();
}

