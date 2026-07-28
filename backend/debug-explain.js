const openaiService = require('./src/services/openai.service');
(async () => {
  try {
    const result = await openaiService.explainError({
      language: 'java',
      error: 'Test error',
      sourceCode: 'public class Main { public static void main(String[] args) { System.out.println("hi"); } }',
    });
    console.log('RESULT', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('MESSAGE:', err.message);
    console.error('STATUS:', err.status);
    console.error('SERVICE:', err.service);
    if (err.code) console.error('CODE:', err.code);
    if (err.response) {
      console.error('RESPONSE STATUS:', err.response.status);
      console.error('RESPONSE DATA:', JSON.stringify(err.response.data || err.response, null, 2));
      console.error('RESPONSE HEADERS:', JSON.stringify(err.response.headers || {}, null, 2));
    }
    console.error(err.stack);
    process.exit(1);
  }
})();
