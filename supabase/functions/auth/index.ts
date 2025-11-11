import { createClient } from 'npm:@supabase/supabase-js@2';
import { compare, hash } from 'npm:bcrypt@5';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (path.endsWith('/login')) {
      const { email, password } = await req.json();

      const { data: user, error } = await supabase
        .from('users')
        .select('id, name, email, password_hash')
        .eq('email', email)
        .single();

      if (error || !user) {
        return new Response(
          JSON.stringify({ message: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isValid = await compare(password, user.password_hash);
      if (!isValid) {
        return new Response(
          JSON.stringify({ message: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = btoa(JSON.stringify({ userId: user.id, email: user.email, exp: Date.now() + 86400000 }));

      return new Response(
        JSON.stringify({
          token,
          email: user.email,
          name: user.name,
          userId: user.id,
          message: 'Login successful'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (path.endsWith('/register')) {
      const { name, email, password } = await req.json();

      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return new Response(
          JSON.stringify({ message: 'Email already exists' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const passwordHash = await hash(password, 10);

      const { data: newUser, error } = await supabase
        .from('users')
        .insert({ name, email, password_hash: passwordHash })
        .select('id, name, email')
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Registration failed', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = btoa(JSON.stringify({ userId: newUser.id, email: newUser.email, exp: Date.now() + 86400000 }));

      return new Response(
        JSON.stringify({
          token,
          email: newUser.email,
          name: newUser.name,
          userId: newUser.id,
          message: 'Registration successful'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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