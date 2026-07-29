require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('GROQ_API_KEY is not set in backend/.env');
      process.exit(1);
    }
    const baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1';
    const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    console.log(`Testing Groq API with model: ${model}...`);
    const res = await axios.post(`${baseUrl}/chat/completions`, {
      model: model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Say hello from Groq!' }
      ],
    }, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000,
    });
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', res.data?.choices?.[0]?.message?.content);
  } catch (e) {
    if (e.response) {
      console.error('HTTP ERROR:', e.response.status);
      try {
        console.error(JSON.stringify(e.response.data, null, 2));
      } catch (_) {
        console.error(e.response.data);
      }
    } else {
      console.error('ERROR:', e.code || e.message);
    }
    process.exit(1);
  }
})();
