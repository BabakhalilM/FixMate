// apps/api-server/test-config.ts
import dotenv from 'dotenv';
dotenv.config();

console.log('📋 Environment Check:');
console.log('  - GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? '✅' : '❌');
console.log('  - GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? '✅' : '❌');
console.log('  - GOOGLE_LOCATION:', process.env.GOOGLE_LOCATION || 'us-central1 (default)');