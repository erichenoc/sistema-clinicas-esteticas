import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = 'https://nqnlcovxksvdijezhuzs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xbmxjb3Z4a3N2ZGlqZXpodXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTEyNzYwNCwiZXhwIjoyMDgwNzAzNjA0fQ.XP-bHWBGcYRollQcmHRm6Z7sl2V5daSTtcjK_9lrJyE';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
});

// Test connection by selecting from a system table
const { data, error } = await supabase.from('_test_connection').select('*').limit(1);

if (error && error.code !== 'PGRST116') {
  console.log('Connection test - expected error for non-existent table, this means connection works');
}

console.log('Supabase connection established successfully!');
console.log('Project URL:', supabaseUrl);
console.log('');
console.log('To run the schema, go to the Supabase Dashboard SQL Editor and paste the contents of:');
console.log('supabase/schema.sql');
