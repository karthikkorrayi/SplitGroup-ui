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

    if (url.pathname.endsWith('/search')) {
      const query = url.searchParams.get('query') || url.searchParams.get('email') || url.searchParams.get('name');
      
      if (!query) {
        return new Response(
          JSON.stringify([]),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: users, error } = await supabase
        .from('users')
        .select('id, name, email')
        .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(10);

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Search failed', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(users || []),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (url.pathname.match(/\/users\/\d+$/)) {
      const requestedUserId = parseInt(url.pathname.split('/').pop()!);
      
      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, created_at')
        .eq('id', requestedUserId)
        .single();

      if (error || !user) {
        return new Response(
          JSON.stringify({ message: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(user),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (url.pathname.match(/\/users\/\d+\/profile$/)) {
      const requestedUserId = parseInt(url.pathname.split('/')[url.pathname.split('/').length - 2]);
      
      if (req.method === 'GET') {
        const { data: user, error } = await supabase
          .from('users')
          .select('id, name, email')
          .eq('id', requestedUserId)
          .single();

        if (error || !user) {
          return new Response(
            JSON.stringify({ message: 'Profile not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            userId: user.id,
            name: user.name,
            email: user.email,
            preferences: { currency: 'USD', notifications: true, theme: 'light' }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (req.method === 'PUT' && requestedUserId === userId) {
        const body = await req.json();
        const { data: updated, error } = await supabase
          .from('users')
          .update({ name: body.name, updated_at: new Date().toISOString() })
          .eq('id', userId)
          .select('id, name, email')
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ message: 'Update failed', error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ userId: updated.id, name: updated.name, email: updated.email }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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