
// Conexão do Harmonize+ com o Supabase
const SUPABASE_URL = "https://cuuednyxcqekpprwhhcl.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_dE9_2Aq2x-McQFSmMeP7tg_jftV81T7";

window.harmonizeSupabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
