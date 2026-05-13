const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  try {
    const body = JSON.parse(event.body || '{}');
    const model = body.payload?.model || "gemini-1.5-flash";
    const contents = body.payload?.contents || [];
    
    // Industrial Context
    const systemPrompt = "You are Aaron's Industrial AI Consultant. Help with HVAC, AHU, and ventilation queries.";

    // API Keys (Fixed Format)
    const keys = [
      "AIzaSyDJgdIyIAi1XimoBW3eiBkuH2rFUVhMQtg",
      "AIzaSyDmNO__fxrao8q-K-LHoIp6x9IEx52LRvg",
      "AIzaSyDaAEDWxCMF-BXsdm3LDP0Qt-en-RR3ZNE",
      "AIzaSyCTQfWHB5bkzgwJyPE2Xzha8jLy4cXRg1A"
    ];

    let errorLog = "";

    for (const key of keys) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
        const postData = JSON.stringify({ 
          contents, 
          system_instruction: { parts: [{ text: systemPrompt }] } 
        });

        const result = await new Promise((resolve, reject) => {
          const req = https.request(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
          }, (res) => {
            let resData = '';
            res.on('data', (d) => resData += d);
            res.on('end', () => resolve({ ok: res.statusCode === 200, data: resData, status: res.statusCode }));
          });
          req.on('error', reject);
          req.write(postData);
          req.end();
        });

        if (result.ok) {
          const data = JSON.parse(result.data);
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidates: [{ content: { parts: [{ text: data.candidates[0].content.parts[0].text }] } }] })
          };
        }
        errorLog = result.data;
      } catch (e) { errorLog = e.message; }
    }

    return { statusCode: 503, body: JSON.stringify({ error: "AI Busy", details: errorLog }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: "System Error", details: err.message }) };
  }
};
