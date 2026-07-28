const axios = require('axios');
(async () => {
  try {
    const res = await axios.post(process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1' + '/chat/completions', {
      model: process.env.NVIDIA_MODEL || 'nvidia/nemotron-3-ultra-550b-a55b',
      temperature: 0.3,
      messages: [{ role: 'system', content: 'debug test' }, { role: 'user', content: 'say hello' }],
    }, {
      headers: { Authorization: 'Bearer ' + process.env.NVIDIA_API_KEY, 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    console.log('STATUS', res.status);
    console.log(JSON.stringify(res.data).slice(0, 1000));
  } catch (e) {
    if (e.response) {
      console.error('HTTP', e.response.status);
      try {
        console.error(JSON.stringify(e.response.data, null, 2));
      } catch (_) {
        console.error(e.response.data);
      }
    } else {
      console.error('ERR', e.code || e.message);
    }
    process.exit(1);
  }
})();
