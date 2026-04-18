/**
 * Production environment configuration.
 */
export const environment = {
  /** Flag indicating if the application is running in production mode */
  production: true,
  supabaseUrl: 'https://qybgnrlszozjhimewkel.supabase.co',
  supabaseKey: 'sb_publishable_nnvdMyVdOClqx-9x62y_Xw_lBTl2bjI',
  /** Base URL de Edge Functions (mismo proyecto Supabase) */
  supabaseFunctionsUrl: 'https://qybgnrlszozjhimewkel.supabase.co/functions/v1',
};