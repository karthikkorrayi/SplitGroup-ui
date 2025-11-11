import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

function getUserIdFromToken(authHeader: string | null): number | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.substring(7);
    const decoded = JSON.parse(atob(token));
    if (decoded.exp && decoded.exp < Date.now()) return null;
    return decoded.userId;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = getUserIdFromToken(req.headers.get('Authorization'));

    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (url.pathname.endsWith('/summary')) {
      await supabase.rpc('set_app_user_id', { user_id: userId });

      const { data: balances, error } = await supabase
        .from('balances')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Failed to fetch balances', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let totalOwed = 0;
      let totalOwing = 0;

      (balances || []).forEach(balance => {
        const amount = parseFloat(balance.amount);
        if (balance.user1_id === userId) {
          if (amount > 0) totalOwed += amount;
          else totalOwing += Math.abs(amount);
        } else {
          if (amount > 0) totalOwing += amount;
          else totalOwed += Math.abs(amount);
        }
      });

      return new Response(
        JSON.stringify({
          totalOwed,
          totalOwing,
          netBalance: totalOwed - totalOwing,
          balances: []
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Internal server error', error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});