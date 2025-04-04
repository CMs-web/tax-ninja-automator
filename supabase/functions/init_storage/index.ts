
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

    // Create the "invoices" storage bucket if it doesn't exist
    const { error: bucketError } = await supabaseAdmin.storage.createBucket('invoices', {
      public: false,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError
    }

    // Create RLS policy for the bucket
    const { error: policyError } = await supabaseAdmin.rpc('create_storage_policy', {
      bucket_id: 'invoices',
      policy_name: 'User Invoice Files Access',
      policy_definition: `auth.uid()::text = (storage.foldername(name))[1]`
    })

    if (policyError && !policyError.message.includes('already exists')) {
      throw policyError
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Storage bucket "invoices" and policies have been configured.'
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
