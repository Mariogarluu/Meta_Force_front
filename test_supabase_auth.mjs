import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qybgnrlszozjhimewkel.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nnvdMyVdOClqx-9x62y_Xw_lBTl2bjI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const email = `test.signup.metaforce.${Date.now()}@gmail.com`;
  const password = 'Test.Password.1234';
  console.log(`Trying to signUp: ${email}`);
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: 'Test User'
        }
      }
    });
    console.log('SignUp Data:', JSON.stringify(data));
    console.log('SignUp Error:', JSON.stringify(error));
  } catch (err) {
    console.error('Catch error:', err);
  }
}

test();
