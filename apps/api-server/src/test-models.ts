// apps/api-server/src/test-models.ts
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testFreeKey() {
  const apiKey = (process.env.FREE || process.env.GOOGLE_AI_API_KEY_GEMINI)?.trim();

  console.log('🔑 Testing AQ. Auth Key with Gemini 3.6...');
  console.log('='.repeat(50));

  if (!apiKey) {
    console.error('❌ No API key found in .env!');
    return;
  }

  // Active models
  const models = [
    'gemini-3.6-flash',
    'gemini-2.5-flash'
  ];

  for (const model of models) {
    try {
      console.log(`\n📤 Testing model: ${model}`);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say "OK" in one word.' }] }]
        })
      });

      const data = await response.json();

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'OK';
        console.log(`✅ ${model} WORKS! Response: ${text.trim()}`);
        console.log('\n🎉 Key and active models are functioning!');
        return;
      } else {
        console.log(`❌ ${model} failed (${response.status}):`, data.error?.message || data);
      }
    } catch (error: any) {
      console.log(`❌ Network Error on ${model}: ${error.message}`);
    }
  }

  console.log('\n⚠️ Failed to call endpoints.');
}

testFreeKey();