'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">📦</span>
          <h1 className="text-2xl font-bold text-[#1A1C2E] mt-3">EstoqueApp</h1>
          <p className="text-sm text-[#6B7280] mt-1">Controle inteligente de estoque</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#FEE2E2] border border-[#EF4444] text-[#C05040] text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#6B7280]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C8E8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#6B7280]">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C8E8]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#6D8FB0] text-white font-semibold rounded-xl hover:bg-[#5A7A9A] transition-colors disabled:opacity-60"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Não tem conta?{' '}
          <Link href="/auth/register" className="font-semibold text-[#6D8FB0] hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
