
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rqomssyihwvbwtoyjwws.supabase.co';
const supabaseKey = 'sb_publishable_zbRk6dglAStUxLQktgvGTg_LhTfVABA';

export const supabase = createClient(supabaseUrl, supabaseKey);
