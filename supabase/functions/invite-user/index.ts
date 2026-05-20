import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type UserRole = 'owner' | 'admin' | 'operator' | 'viewer'
const ALLOWED_INVITE_ROLES: UserRole[] = ['admin', 'operator', 'viewer']

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: CORS })
    }

    // Cliente com a sessão do usuário que está convidando
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    // Cliente admin (service role) para operações privilegiadas
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verifica identidade e role do chamador
    const { data: { user: callerUser } } = await supabaseUser.auth.getUser()
    if (!callerUser) {
      return new Response(JSON.stringify({ error: 'Não autenticado' }), { status: 401, headers: CORS })
    }

    const { data: callerProfile } = await supabaseAdmin
      .from('users')
      .select('tenant_id, role')
      .eq('id', callerUser.id)
      .single()

    if (!callerProfile || !['owner', 'admin'].includes(callerProfile.role)) {
      return new Response(
        JSON.stringify({ error: 'Apenas owner ou admin podem convidar usuários' }),
        { status: 403, headers: CORS },
      )
    }

    const { email, role, full_name } = await req.json()

    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'email e role são obrigatórios' }), { status: 400, headers: CORS })
    }

    // owner pode convidar qualquer role abaixo; admin pode convidar operator e viewer
    if (callerProfile.role === 'admin' && !['operator', 'viewer'].includes(role)) {
      return new Response(
        JSON.stringify({ error: 'Admin só pode convidar operator ou viewer' }),
        { status: 403, headers: CORS },
      )
    }

    if (!ALLOWED_INVITE_ROLES.includes(role)) {
      return new Response(JSON.stringify({ error: 'Role inválido' }), { status: 400, headers: CORS })
    }

    // Verifica se usuário já existe no tenant
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('tenant_id', callerProfile.tenant_id)
      .maybeSingle()

    const appUrl = Deno.env.get('APP_URL') ?? 'http://localhost:3000'

    // Envia convite — o trigger handle_new_user usará os metadados para inserir no tenant correto
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        full_name:   full_name ?? email.split('@')[0],
        tenant_id:   callerProfile.tenant_id,
        role:        role,
        invited_by:  callerUser.id,
      },
      redirectTo: `${appUrl}/auth/accept-invite`,
    })

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      )
    }

    return new Response(
      JSON.stringify({ message: 'Convite enviado com sucesso', user_id: data.user.id }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    )
  }
})
