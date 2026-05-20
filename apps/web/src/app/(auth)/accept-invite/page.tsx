'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [ready, setReady]       = useState(false)
  const [email, setEmail]       = useState('')

  useEffect(() => {
    // O link de convite do Supabase define a sessão via hash params (access_token)
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session) {
        setEmail(session.user.email ?? '')
        // Pré-preenche nome dos metadados do convite
        const meta = session.user.user_metadata
        if (meta?.full_name) setFullName(meta.full_name)
        setReady(true)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName || !password) { setError('Preencha todos os campos.'); return }
    if (password.length < 6)   { setError('Senha deve ter pelo menos 6 caracteres.'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()

    // Atualiza senha e nome do usuário
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { full_name: fullName },
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    // Atualiza o nome no perfil público
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ full_name: fullName }).eq('id', user.id)
    }

    router.push('/dashboard')
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">⏳</p>
          <p className="text-[#6B7280]">Processando seu convite...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">📦</span>
          <h1 className="text-2xl font-bold text-[#1A1C2E] mt-3">Bem-vindo ao EstoqueApp</h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Complete seu cadastro para acessar o sistema
          </p>
          {email && <p className="text-xs text-[#9CA3AF] mt-1">{email}</p>}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#FEE2E2] border border-[#EF4444] text-[#C05040] text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#6B7280]">Seu nome</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="João Silva"
              required
              className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C8E8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#6B7280]">Defina sua senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C8E8]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#6D8FB0] text-white font-semibold rounded-xl hover:bg-[#5A7A9A] transition-colors disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Acessar sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}
