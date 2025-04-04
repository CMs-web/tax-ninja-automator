
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // Execute SQL to create the policy directly
    const { error } = await supabaseAdmin.rpc(
      'exec_sql',
      {
        sql_query: `
          -- Create policy for users to access their own files
          CREATE POLICY IF NOT EXISTS "Users can upload and access their own invoices"
          ON storage.objects
          FOR ALL
          USING (
            bucket_id = 'invoices' AND
            auth.uid()::text = (storage.foldername(name))[1]
          )
          WITH CHECK (
            bucket_id = 'invoices' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );
        `
      }
    )

    if (error) throw error

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage policies have been configured.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
