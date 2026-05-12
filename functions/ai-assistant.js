exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, payload } = JSON.parse(event.body);

    // 1. All Keys
    const geminiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
      process.env.GEMINI_API_KEY_4,
      process.env.GEMINI_API_KEY_5,
      process.env.GEMINI_API_KEY_6
    ].filter(k => !!k);

    const grokKeys = [
      process.env.GROK_API_KEY,
      process.env.GROK_API_KEY_2,
      process.env.GROK_API_KEY_3
    ].filter(k => !!k);

    if (geminiKeys.length === 0 && grokKeys.length === 0) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing API Keys. Please add GEMINI_API_KEY to Netlify variables." }) };
    }

    let lastError = "Unknown Error";

    // --- PHASE 1: GEMINI ---
    for (const key of geminiKeys) {
      try {
        let apiUrl = '';
        let bodyContent = {};

        if (action === 'chat') {
          const { systemInstruction, contents, model = 'gemini-1.5-flash' } = payload;
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
          bodyContent = {
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
          };
        } else if (action === 'vision') {
          const { imageBase64, prompt } = payload;
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
          bodyContent = {
            contents: [{
              parts: [
                { text: prompt },
                { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
              ]
            }]
          };
        }

        const res = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyContent)
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          lastError = data.error?.message || `HTTP ${res.status}`;
          continue;
        }
        return { statusCode: 200, body: JSON.stringify(data) };

      } catch (err) { lastError = err.message; continue; }
    }

    // --- PHASE 2: GROK ---
    if (action === 'chat') {
      for (const key of grokKeys) {
        try {
          const { systemInstruction, contents } = payload;
          const response = await fetch("https://api.x.ai/v1/chat/completions", {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: "grok-beta",
              messages: [
                { role: "system", content: systemInstruction },
                ...contents.map(c => ({ role: c.role === 'user' ? 'user' : 'assistant', content: c.parts[0].text }))
              ]
            })
          });

          const data = await response.json();
          if (!response.ok || data.error) {
            lastError = data.error?.message || `HTTP ${response.status}`;
            continue;
          }

          const mapped = {
            candidates: [{ content: { parts: [{ text: data.choices[0].message.content }] } }]
          };
          return { statusCode: 200, body: JSON.stringify(mapped) };

        } catch (err) { lastError = err.message; continue; }
      }
    }

    return { statusCode: 503, body: JSON.stringify({ error: "AI service issue. Check keys.", details: lastError }) };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'System Failure', details: error.message }) };
  }
};
