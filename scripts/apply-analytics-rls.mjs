/**
 * Deploy admin-analytics Edge Function via Supabase Management API
 * Uses service_role key (must have project admin access)
 */

import { readFileSync } from 'fs';

const PROJECT_REF = 'qybgnrlszozjhimewkel';
const SERVICE_KEY = 'REDACTED_JWT';

const functionCode = readFileSync(
  'C:/Users/McLovin/Desktop/Meta-force-back/supabase/functions/admin-analytics/index.ts',
  'utf8'
);

const corsCode = readFileSync(
  'C:/Users/McLovin/Desktop/Meta-force-back/supabase/functions/_shared/cors.ts',
  'utf8'
);

// The entrypoint code with cors embedded
const bundledCode = functionCode.replace(
  `import { jsonResponse, preflight } from "../_shared/cors.ts";`,
  corsCode.replace('export ', '') + '\n' + 'const { jsonResponse, preflight } = { jsonResponse, preflight };'
);

console.log('📦 Deploying admin-analytics function...');

// Try via Management API (requires PAT, but let's try service_role)
const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    slug: 'admin-analytics',
    name: 'admin-analytics',
    body: functionCode,
    verify_jwt: true
  })
});

console.log('Status:', response.status);
console.log('Response:', await response.text());
