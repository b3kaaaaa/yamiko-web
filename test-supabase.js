const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    const { data, error } = await supabase.from('manga').select('id, title').limit(1);
    if (error) {
        console.error('Error fetching manga:', error);
    } else {
        console.log('Success fetching manga:', data);
    }

    const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);
    if (pError) {
        console.error('Error fetching profiles:', pError);
    } else {
        console.log('Success fetching profiles:', profiles);
    }
}

test();
