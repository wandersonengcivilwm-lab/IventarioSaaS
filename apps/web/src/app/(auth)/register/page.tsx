'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [fullName, setFullName]       = useState('')
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [loading, setLoading]         = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, company_name: companyName },
      },
    })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <span className="text-5xl">🎉</span>
          <h2 className="text-2xl font-bold mt-4">Conta criada!</h2>
          <p className="text-[#6B7280] mt-2">
            Verifique seu e-mail para confirmar o cadastro.
          </p>
          <Link
            href="/auth/login"
            className="mt-6 inline-block bg-[#6D8FB0] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-[#5A7A9A] transition-colors"
          >
            Ir para login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1A1C2E]">Criar conta</h1>
          <p className="text-sm text-[#6B7280] mt-1">Comece grátis — sem cartão de crédito</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#FEE2E2] border border-[#EF4444] text-[#C05040] text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {[
            { label: 'Seu nome',    value: fullName,     setter: setFullName,     type: 'text',     placeholder: 'João Silva' },
            { label: 'Empresa',     value: companyName,  setter: setCompanyName,  type: 'text',     placeholder: 'Minha Empresa Ltda' },
            { label: 'E-mail',      value: email,        setter: setEmail,        type: 'email',    placeholder: 'joao@empresa.com' },
            { label: 'Senha',       value: password,     setter: setPassword,     type: 'password', placeholder: 'Mínimo 6 caracteres' },
          ].map(field => (
            <div key={field.label} className="space-y-1">
              <label className="text-sm font-medium text-[#6B7280]">{field.label}</label>
              <input
                type={field.type}
                value={field.value}
                onChange={e => field.setter(e.target.value)}
                placeholder={field.placeholder}
                required
                className="w-full h-11 px-4 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C8E8]"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#6D8FB0] text-white font-semibold rounded-xl hover:bg-[#5A7A9A] transition-colors disabled:opacity-60"
          >
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          Já tem conta?{' '}
          <Link href="/auth/login" className="font-semibold text-[#6D8FB0] hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
