
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  try {
    // Initialize Supabase client with service role key (admin access)
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Create test admin user
    const email = "admin@taxninja.com";
    const password = "admintest123"; // this is hardcoded for demonstration purposes only

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    
    const existingAdmin = existingUsers?.users?.find(user => user.email === email);
    
    if (existingAdmin) {
      return new Response(JSON.stringify({ 
        message: "Test admin user already exists",
        userId: existingAdmin.id 
      }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      });
    }

    // Create the admin user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
    });

    if (userError) throw userError;

    // Add user to admin_users table
    if (userData?.user) {
      const { error: adminError } = await supabase
        .from("admin_users")
        .insert([{ id: userData.user.id, is_super_admin: true }]);

      if (adminError) throw adminError;
    }

    return new Response(JSON.stringify({ 
      message: "Test admin user created successfully",
      userId: userData?.user?.id,
      email
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
  } catch (error) {
    console.error("Error creating test user:", error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
