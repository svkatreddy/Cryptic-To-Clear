const axios = require('axios');
(async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/explain', {
      language: 'java',
      error: 'Test error',
      sourceCode: 'public class Main { public static void main(String[] args) { System.out.println("hi"); } }',
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000,
    });
    console.log('STATUS', res.status);
    console.log('DATA', JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error('HTTP', err.response.status);
      console.error('DATA', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('ERROR', err.message);
    }
    process.exit(1);

    
  }
})();
