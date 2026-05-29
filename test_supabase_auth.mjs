import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qybgnrlszozjhimewkel.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nnvdMyVdOClqx-9x62y_Xw_lBTl2bjI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const email = `test.auth.metaforce.${Date.now()}@gmail.com`;
  const password = 'Correct.Password.1234';
  
  console.log(`1. SignUp user: ${email}`);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  });
  if (signUpError) {
    console.error('SignUp Error:', signUpError);
    return;
  }
  console.log('SignUp Successful!');

  console.log('\n2. SignIn with CORRECT password...');
  const { data: signInCorrect, error: errorCorrect } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  console.log('SignIn Correct Error:', errorCorrect);
  console.log('SignIn Correct Session exists:', !!signInCorrect?.session);

  console.log('\n3. SignIn with INCORRECT password...');
  const { data: signInIncorrect, error: errorIncorrect } = await supabase.auth.signInWithPassword({
    email,
    password: 'WrongPassword'
  });
  console.log('SignIn Incorrect Error:', errorIncorrect?.message);
  console.log('SignIn Incorrect Session exists:', !!signInIncorrect?.session);

  console.log('\n4. Attempting password update...');
  // Since we did signIn with wrong password, let's see if the client lost session or if it's still signed in from step 2
  const { data: sessionData } = await supabase.auth.getSession();
  console.log('Active session still exists:', !!sessionData?.session);

  console.log('\n5. Try password change directly...');
  // Let's re-authenticate first to make sure we have active session
  await supabase.auth.signInWithPassword({ email, password });
  const { data: updateData, error: updateError } = await supabase.auth.updateUser({
    password: 'New.Correct.Password.1234'
  });
  console.log('Update Error:', updateError?.message);
  console.log('Update Success User ID:', updateData?.user?.id);
}

test();
