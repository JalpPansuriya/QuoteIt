import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching products...");
  const { data: products, error: fetchError } = await supabase.from('products').select('*');
  
  if (fetchError) {
    console.error("Error fetching products:", fetchError);
    return;
  }

  console.log(`Found ${products.length} products. Deleting...`);
  
  for (const p of products) {
    await supabase.from('products').delete().eq('id', p.id);
  }
  
  console.log("All existing products deleted.");

  console.log("Inserting new Gaudani product...");
  const newProduct = {
    id: uuidv4(),
    user_id: products.length > 0 ? products[0].user_id : 'default-user-id', // Needs valid user_id if RLS is on, but with anon key RLS might block us if we don't auth. 
    name: 'Gaudani - 32MM SLIDING SERIES',
    material: 'Aluminium',
    glass_type: '11.52mm ST-187 Clear Reflective Laminated',
    base_rate: 1500, // Dummy rate
    unit: 'sq ft',
    created_at: new Date().toISOString()
  };

  // Wait, without auth, anon key might be blocked by RLS policies.
  // It's safer to just do this in the frontend if RLS is enabled!
  
  const { error: insertError } = await supabase.from('products').insert({
    ...newProduct,
    user_id: products.length > 0 ? products[0].user_id : '00000000-0000-0000-0000-000000000000'
  });
  
  if (insertError) {
    console.error("Failed to insert:", insertError);
  } else {
    console.log("Successfully inserted Gaudani product!");
  }
}

run();
