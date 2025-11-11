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

    if (req.method === 'POST' && url.pathname.endsWith('/transactions')) {
      const { description, amount, category, participants } = await req.json();

      await supabase.rpc('set_app_user_id', { user_id: userId });

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert({
          description,
          amount,
          category,
          paid_by: userId,
          status: 'ACTIVE'
        })
        .select('*')
        .single();

      if (txError) {
        return new Response(
          JSON.stringify({ message: 'Failed to create transaction', error: txError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const participantInserts = participants.map((p: any) => ({
        transaction_id: transaction.id,
        user_id: p.userId,
        amount: p.amount,
        settled: false
      }));

      const { error: partError } = await supabase
        .from('transaction_participants')
        .insert(participantInserts);

      if (partError) {
        await supabase.from('transactions').delete().eq('id', transaction.id);
        return new Response(
          JSON.stringify({ message: 'Failed to add participants', error: partError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: payer } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();

      const { data: participantsData } = await supabase
        .from('transaction_participants')
        .select('user_id, amount, settled')
        .eq('transaction_id', transaction.id);

      const participantUsers = await Promise.all(
        (participantsData || []).map(async (p) => {
          const { data: user } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', p.user_id)
            .single();
          return {
            userId: p.user_id,
            userName: user?.name || 'Unknown',
            userEmail: user?.email || '',
            amount: p.amount,
            settled: p.settled
          };
        })
      );

      return new Response(
        JSON.stringify({
          id: transaction.id,
          description: transaction.description,
          amount: transaction.amount,
          category: transaction.category,
          paidBy: userId,
          paidByName: payer?.name || 'Unknown',
          participants: participantUsers,
          createdAt: transaction.created_at,
          status: transaction.status
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET' && url.pathname.endsWith('/transactions')) {
      const page = parseInt(url.searchParams.get('page') || '0');
      const size = parseInt(url.searchParams.get('size') || '20');
      const offset = page * size;

      await supabase.rpc('set_app_user_id', { user_id: userId });

      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .or(`paid_by.eq.${userId},id.in.(select transaction_id from transaction_participants where user_id=${userId})`);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`paid_by.eq.${userId},id.in.(select transaction_id from transaction_participants where user_id=${userId})`)
        .order('created_at', { ascending: false })
        .range(offset, offset + size - 1);

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Failed to fetch transactions', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const enriched = await Promise.all(
        (transactions || []).map(async (tx) => {
          const { data: payer } = await supabase
            .from('users')
            .select('name')
            .eq('id', tx.paid_by)
            .single();

          const { data: parts } = await supabase
            .from('transaction_participants')
            .select('user_id, amount, settled')
            .eq('transaction_id', tx.id);

          const participantUsers = await Promise.all(
            (parts || []).map(async (p) => {
              const { data: user } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', p.user_id)
                .single();
              return {
                userId: p.user_id,
                userName: user?.name || 'Unknown',
                userEmail: user?.email || '',
                amount: p.amount,
                settled: p.settled
              };
            })
          );

          return {
            id: tx.id,
            description: tx.description,
            amount: parseFloat(tx.amount),
            category: tx.category,
            paidBy: tx.paid_by,
            paidByName: payer?.name || 'Unknown',
            participants: participantUsers,
            createdAt: tx.created_at,
            status: tx.status
          };
        })
      );

      return new Response(
        JSON.stringify({
          transactions: enriched,
          total: count || 0,
          page,
          size
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET' && url.pathname.endsWith('/recent')) {
      const limit = parseInt(url.searchParams.get('limit') || '5');

      await supabase.rpc('set_app_user_id', { user_id: userId });

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .or(`paid_by.eq.${userId},id.in.(select transaction_id from transaction_participants where user_id=${userId})`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        return new Response(
          JSON.stringify({ message: 'Failed to fetch transactions', error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const enriched = await Promise.all(
        (transactions || []).map(async (tx) => {
          const { data: payer } = await supabase.from('users').select('name').eq('id', tx.paid_by).single();
          const { data: parts } = await supabase.from('transaction_participants').select('user_id, amount, settled').eq('transaction_id', tx.id);
          const participantUsers = await Promise.all(
            (parts || []).map(async (p) => {
              const { data: user } = await supabase.from('users').select('name, email').eq('id', p.user_id).single();
              return { userId: p.user_id, userName: user?.name || 'Unknown', userEmail: user?.email || '', amount: p.amount, settled: p.settled };
            })
          );
          return {
            id: tx.id, description: tx.description, amount: parseFloat(tx.amount), category: tx.category,
            paidBy: tx.paid_by, paidByName: payer?.name || 'Unknown', participants: participantUsers,
            createdAt: tx.created_at, status: tx.status
          };
        })
      );

      return new Response(JSON.stringify(enriched), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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