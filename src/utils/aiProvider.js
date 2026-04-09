export const GEMINI_MODELS = [
  { id: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash (Preview)' },
  { id: 'gemini-2.5-pro-preview-05-06',   label: 'Gemini 2.5 Pro (Preview)' },
  { id: 'gemini-2.0-flash',               label: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-flash-lite',          label: 'Gemini 2.0 Flash Lite' },
  { id: 'gemini-1.5-pro',                 label: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash',               label: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-flash-8b',            label: 'Gemini 1.5 Flash 8B' },
];

export const OPENROUTER_MODELS = [
  { id: 'google/gemini-2.5-pro-preview',       label: 'Gemini 2.5 Pro (Preview)' },
  { id: 'google/gemini-2.0-flash-001',         label: 'Gemini 2.0 Flash' },
  { id: 'google/gemini-flash-1.5',             label: 'Gemini 1.5 Flash' },
  { id: 'google/gemini-pro-1.5',               label: 'Gemini 1.5 Pro' },
  { id: 'anthropic/claude-sonnet-4-5',         label: 'Claude Sonnet 4.5' },
  { id: 'anthropic/claude-3.5-sonnet',         label: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3.5-haiku',          label: 'Claude 3.5 Haiku' },
  { id: 'openai/gpt-4o',                       label: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini',                  label: 'GPT-4o Mini' },
  { id: 'meta-llama/llama-3.3-70b-instruct',   label: 'Llama 3.3 70B' },
  { id: 'deepseek/deepseek-chat',              label: 'DeepSeek Chat' },
  { id: 'deepseek/deepseek-r1',               label: 'DeepSeek R1' },
  { id: 'qwen/qwen-2.5-72b-instruct',          label: 'Qwen 2.5 72B' },
  { id: 'mistralai/mistral-large',             label: 'Mistral Large' },
];

export const AGENTROUTER_MODELS = [
  { id: 'openai/gpt-4o',              label: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini',         label: 'GPT-4o Mini' },
  { id: 'openai/gpt-4.1',             label: 'GPT-4.1' },
  { id: 'openai/gpt-4.1-mini',        label: 'GPT-4.1 Mini' },
  { id: 'anthropic/claude-sonnet-4-5',label: 'Claude Sonnet 4.5' },
  { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
  { id: 'deepseek/deepseek-chat',     label: 'DeepSeek Chat' },
  { id: 'deepseek/deepseek-r1',       label: 'DeepSeek R1' },
  { id: 'zhipu-ai/glm-4',             label: 'GLM-4 (Zhipu AI)' },
];

export function getModelList(provider) {
  if (provider === 'gemini') return GEMINI_MODELS;
  if (provider === 'openrouter') return OPENROUTER_MODELS;
  if (provider === 'agentrouter') return AGENTROUTER_MODELS;
  return [];
}

export function getDefaultModel(provider) {
  if (provider === 'gemini') return 'gemini-2.0-flash';
  if (provider === 'openrouter') return 'google/gemini-flash-1.5';
  if (provider === 'agentrouter') return 'openai/gpt-4o-mini';
  return '';
}

export async function callAI({ systemPrompt, messages, appSettings }) {
  const provider = appSettings?.aiProvider || 'gemini';

  if (provider === 'gemini') {
    const apiKey = appSettings?.geminiApiKey || '';
    if (!apiKey) throw new Error('NO_KEY');
    const model = appSettings?.geminiModel || 'gemini-2.0-flash';
    return callGemini({ systemPrompt, messages, apiKey, model });

  } else if (provider === 'openrouter') {
    const apiKey = appSettings?.openrouterApiKey || '';
    if (!apiKey) throw new Error('NO_KEY');
    const model = appSettings?.openrouterModel || 'google/gemini-flash-1.5';
    return callOpenRouterCompat({
      systemPrompt, messages, apiKey, model,
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      extraHeaders: {
        'HTTP-Referer': 'https://miftah.store',
        'X-Title': 'Miftah Store Manager',
      },
    });

  } else if (provider === 'agentrouter') {
    const apiKey = appSettings?.agentrouterApiKey || '';
    if (!apiKey) throw new Error('NO_KEY');
    const model = appSettings?.agentrouterModel || 'openai/gpt-4o-mini';
    return callOpenRouterCompat({
      systemPrompt, messages, apiKey, model,
      baseUrl: 'https://agentrouter.org/v1/chat/completions',
    });

  } else {
    throw new Error('NO_KEY');
  }
}

async function callGemini({ systemPrompt, messages, apiKey, model }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

async function callOpenRouterCompat({ systemPrompt, messages, apiKey, model, baseUrl, extraHeaders = {} }) {
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
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
