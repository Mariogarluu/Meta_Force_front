/**
 * Test directo de la Edge Function admin-analytics
 * Simula exactamente lo que hace el navegador cuando llama a la función
 */

import { createClient } from '../node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://qybgnrlszozjhimewkel.supabase.co';
const ANON_KEY = 'REDACTED_JWT';

const SUPERADMIN_EMAIL = 'metaforcegym@gmail.com';
const SUPERADMIN_PASS = 'StephenNigga30';

const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log('1️⃣  Iniciando sesión como superadmin...');
  
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: SUPERADMIN_EMAIL,
    password: SUPERADMIN_PASS
  });
  
  if (authErr) {
    console.error('❌ Error de login:', authErr.message);
    console.error('   → Prueba con otra contraseña en el script test-analytics.mjs');
    
    // Intentar sin login para ver qué devuelve la función sin auth
    console.log('\n2️⃣  Intentando llamar a la función SIN autenticación...');
    const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-analytics`, {
      headers: { 'apikey': ANON_KEY }
    });
    console.log('   Status sin auth:', res.status);
    console.log('   Body sin auth:', await res.text());
    return;
  }
  
  console.log('✅ Login OK. User ID:', authData.user?.id);
  console.log('   Access token (primeros 50 chars):', authData.session?.access_token?.substring(0, 50) + '...');
  
  console.log('\n2️⃣  Llamando a Edge Function admin-analytics...');
  
  // Método 1: via supabase.functions.invoke (igual que Angular)
  const { data, error } = await supabase.functions.invoke('admin-analytics');
  
  if (error) {
    console.error('❌ Error via functions.invoke:', error);
    console.error('   error.message:', error?.message);
    console.error('   error.status:', error?.status);
    console.error('   error.context:', error?.context);
    console.error('   JSON completo:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ Respuesta OK!');
    console.log('   users:', data?.users?.length ?? 0);
    console.log('   roles:', data?.roles?.length ?? 0);
    console.log('   bodyWeights:', data?.bodyWeights?.length ?? 0);
    console.log('   exerciseRecords:', data?.exerciseRecords?.length ?? 0);
    console.log('   subscriptions:', data?.subscriptions?.length ?? 0);
  }
  
  console.log('\n3️⃣  Llamando directamente via fetch con JWT...');
  const token = authData.session?.access_token;
  const res2 = await fetch(`${SUPABASE_URL}/functions/v1/admin-analytics`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': ANON_KEY
    }
  });
  console.log('   Status HTTP:', res2.status);
  const bodyText = await res2.text();
  try {
    const json = JSON.parse(bodyText);
    if (json.users) {
      console.log('✅ Respuesta JSON OK:', { users: json.users?.length, roles: json.roles?.length });
    } else {
      console.log('   JSON response:', JSON.stringify(json, null, 2));
    }
  } catch {
    console.log('   Body raw:', bodyText.substring(0, 500));
  }
  
  await supabase.auth.signOut();
}

main().catch(console.error);
