
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Create a Supabase client with the Admin key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create the admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@taxninja.com",
      password: "admintest123",
      email_confirm: true,
      user_metadata: {
        business_name: "Tax Ninja Admin",
      },
    });

    if (userError) {
      throw userError;
    }

    // Add the user to admin_users table
    if (userData.user) {
      const { error: adminError } = await supabaseAdmin
        .from("admin_users")
        .insert({ 
          id: userData.user.id,
          is_super_admin: true
        })
        .select()
        .single();

      if (adminError && adminError.code !== "23505") { // Ignore duplicate key errors
        throw adminError;
      }

      console.log("Admin user created:", userData.user.email);
    }

    return new Response(
      JSON.stringify({
        message: "Admin user created successfully",
        email: "admin@taxninja.com",
        password: "admintest123",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating admin user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
