/**
 * Despliega la Edge Function admin-analytics vía Supabase Management API.
 * Requiere SUPABASE_ACCESS_TOKEN (PAT del dashboard), no la service_role key.
 *
 * Uso:
 *   SUPABASE_ACCESS_TOKEN=... node scripts/apply-analytics-rls.mjs
 *
 * Variables opcionales: SUPABASE_URL (para derivar project ref).
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { envOrThrow, projectRefFromUrl, loadEnv } from './load-env.mjs';

loadEnv();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACK_ROOT = path.resolve(__dirname, '..', '..', 'back');

const supabaseUrl = envOrThrow('SUPABASE_URL', [
  'NEXT_PUBLIC_SUPABASE_URL',
]);
const PROJECT_REF = projectRefFromUrl(supabaseUrl);
const ACCESS_TOKEN = envOrThrow('SUPABASE_ACCESS_TOKEN');

const functionCode = readFileSync(
  path.join(BACK_ROOT, 'supabase/functions/admin-analytics/index.ts'),
  'utf8'
);

console.log('📦 Deploying admin-analytics function...');

const response = await fetch(
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/functions`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      slug: 'admin-analytics',
      name: 'admin-analytics',
      body: functionCode,
      verify_jwt: true,
    }),
  }
);

console.log('Status:', response.status);
console.log('Response:', await response.text());
