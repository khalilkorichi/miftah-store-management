const GEMINI_MODEL = 'gemini-1.5-flash';
const OPENROUTER_MODEL = 'google/gemini-flash-1.5';

export async function callAI({ systemPrompt, messages, appSettings }) {
  const provider = appSettings?.aiProvider || 'gemini';

  if (provider === 'gemini') {
    const apiKey = appSettings?.geminiApiKey || '';
    if (!apiKey) throw new Error('NO_KEY');
    return callGemini({ systemPrompt, messages, apiKey });
  } else {
    const apiKey = appSettings?.openrouterApiKey || '';
    if (!apiKey) throw new Error('NO_KEY');
    return callOpenRouter({ systemPrompt, messages, apiKey });
  }
}

async function callGemini({ systemPrompt, messages, apiKey }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `خطأ في الاتصال: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callOpenRouter({ systemPrompt, messages, apiKey }) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://miftah.store',
      'X-Title': 'Miftah Store Manager',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `خطأ في الاتصال: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}
