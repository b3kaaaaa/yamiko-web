
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Using Anon key to test RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
    console.log("Checking 'Manga' table (Anon key)...");
    const { data: dataCapital, error: errorCapital } = await supabase.from('Manga').select('*').limit(5);
    if (errorCapital) console.log("Error querying 'Manga':", errorCapital.message);
    else console.log("Data from 'Manga':", dataCapital.length, "rows");

    console.log("Checking 'manga' table (Anon key)...");
    const { data: dataLower, error: errorLower } = await supabase.from('manga').select('*').limit(5);
    if (errorLower) console.log("Error querying 'manga':", errorLower.message);
    else console.log("Data from 'manga':", dataLower.length, "rows");
    
    if ((dataCapital?.length === 0) && (dataLower?.length === 0)) {
        console.log("Both tables empty or not found. checking with Admin key...");
        const { data: adminData, error: adminError } = await supabaseAdmin.from('manga').select('*').limit(5);
        if (adminError) {
             const { data: adminDataCap, error: adminErrorCap } = await supabaseAdmin.from('Manga').select('*').limit(5);
             if (adminDataCap) console.log("Admin found data in 'Manga':", adminDataCap.length);
             else console.log("Admin error:", adminError?.message);
        }
        else console.log("Admin found data in 'manga':", adminData.length);
        
        if (!adminData || adminData.length === 0) {
            console.log("Inserting mock manga data...");
             const { error: insertError } = await supabaseAdmin.from('manga').insert([
                { 
                    title: 'Solo Leveling', 
                    slug: 'solo-leveling', 
                    coverImage: 'https://meo.comick.pictures/r/j/5w8l2/01.jpg',
                    description: 'Mock data',
                    rating: 9.8,
                    status: 'ONGOING'
                },
                { 
                    title: 'One Piece', 
                    slug: 'one-piece', 
                    coverImage: 'https://meo.comick.pictures/r/j/p7856/01.jpg',
                    description: 'Mock data',
                    rating: 9.9,
                    status: 'ONGOING'
                }
            ]);
            if (insertError) console.log("Insert error:", insertError);
            else console.log("Mock data inserted.");
        }
    }
}

check();
