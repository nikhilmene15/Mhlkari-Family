// Debug environment variables
console.log('Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
console.log('Service Key Length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Service Key starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
}
