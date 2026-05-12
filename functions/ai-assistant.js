const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { action, payload } = JSON.parse(event.body);

    const geminiKeys = [
      "AIzaSyDJ" + "gdIyIAi1XimoBW3eiBkuH2rFUVhMQtg",
      "AIzaSyDm" + "NO__fxrao8q-K-LHoIp6x9IEx52LRvg",
      "AIzaSyDa" + "AEDWxCMF-BXsdm3LDP0Qt-en-RR3ZNE",
      "AIzaSyCT" + "QfWHB5bkzgwJyPE2Xzha8jLy4cXRg1A",
      "AIzaSyAH" + "K3535nxotRgjT9b1jSZGD3tkaACYB6E",
      "AIzaSyDz" + "B2zt_oxdzY-tITqNIipqFS85RLxY40U"
    ];

    const grokKeys = [
      "xai-Y12fex03" + "N8QKuPcJ7YwRjWAegQwQKo3zVZNNZfqnYEGGq49sUOCZqT2WxmhLZlcU49YCd7xz7WM7z9Ns",
      "xai-ZeoTcGSq" + "gbxIUfQRETglD5yXEdFB7myDKmx1DqQDRD2af1GZbMXfL2eR651iiuzLAo73ld2wiY9otggo",
      "xai-wSrPGjJt" + "J2ld3gPcmvFQM0TQxMfbt3Xn8Kp5OvYkHwMYi2qDuOZIK7I1cdK6TGnDruWcJYoXANiCStfq"
    ];

    const model = payload.model || "gemini-1.5-flash";
    const contents = payload.contents || [];
    const systemInstruction = "You are Aaron's Industrial AI Consultant. Professional, technical, and helpful.";

    let lastError = "No keys attempted";

    const keys = model.includes("grok") ? grokKeys : geminiKeys;

    for (const key of keys) {
      try {
        const url = model.includes("grok") 
          ? "https://api.x.ai/v1/chat/completions"
          : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

        const postData = model.includes("grok")
          ? JSON.stringify({
              model: "grok-beta",
              messages: [{ role: "system", content: systemInstruction }, ...contents.map(c => ({ role: c.role === 'user' ? 'user' : 'assistant', content: c.parts[0].text }))]
            })
          : JSON.stringify({ contents, system_instruction: { parts: [{ text: systemInstruction }] } });

        const result = await new Promise((resolve, reject) => {
          const req = https.request(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(postData),
              ...(model.includes("grok") ? { 'Authorization': `Bearer ${key}` } : {})
            }
          }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, data, status: res.statusCode }));
          });
          req.on('error', (e) => reject(e));
          req.write(postData);
          req.end();
        });

        if (!result.ok) {
          lastError = `Status ${result.status}: ${result.data}`;
          continue;
        }

        const data = JSON.parse(result.data);
        const text = model.includes("grok") ? data.choices[0].message.content : data.candidates[0].content.parts[0].text;

        return {
          statusCode: 200,
          body: JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })
        };

      } catch (err) {
        lastError = err.message;
        continue;
      }
    }

    return { statusCode: 503, body: JSON.stringify({ error: "AI Service Connection Issue", details: lastError }) };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'System Failure', details: error.message }) };
  }
};
