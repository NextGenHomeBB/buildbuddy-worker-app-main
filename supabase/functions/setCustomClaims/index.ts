import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { uid, organization_id } = await req.json();
    
    console.log('Setting custom claims for user:', uid, 'invite code:', organization_id);

    if (!uid || !organization_id) {
      return new Response(
        JSON.stringify({ error: 'Missing uid or organization_id' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Look up invite code to get organization_id
    const { data: inviteCode, error: inviteError } = await supabase
      .from('invite_codes')
      .select('organization_id, expires_at, is_active, current_uses, max_uses')
      .eq('code', organization_id)
      .eq('is_active', true)
      .single();

    if (inviteError || !inviteCode) {
      console.error('Invite code not found or inactive:', inviteError);
      return new Response(
        JSON.stringify({ error: 'Invalid organization code' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if invite code has expired
    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      console.error('Invite code has expired');
      return new Response(
        JSON.stringify({ error: 'Invite code has expired' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if invite code has reached max uses
    if (inviteCode.max_uses && inviteCode.current_uses >= inviteCode.max_uses) {
      console.error('Invite code has reached maximum uses');
      return new Response(
        JSON.stringify({ error: 'Invite code has reached maximum uses' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const actualOrgId = inviteCode.organization_id;

    // Get organization details
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', actualOrgId)
      .single();

    if (orgError || !org) {
      console.error('Organization not found:', orgError);
      return new Response(
        JSON.stringify({ error: 'Invalid organization code' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update user metadata with organization_id and role
    const { error: updateError } = await supabase.auth.admin.updateUserById(uid, {
      user_metadata: {
        organization_id: actualOrgId,
        role: 'worker' // Default role
      }
    });

    if (updateError) {
      console.error('Error updating user metadata:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user claims' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Increment invite code usage count
    const { error: incrementError } = await supabase
      .from('invite_codes')
      .update({ current_uses: (inviteCode.current_uses || 0) + 1 })
      .eq('code', organization_id);

    if (incrementError) {
      console.error('Error incrementing invite code usage:', incrementError);
      // Don't fail the request for this, just log the error
    }

    console.log('Successfully updated user claims');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        organization: { id: org.id, name: org.name }
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in setCustomClaims function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});