'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type UserRole = 'admin' | 'operator' | 'viewer'

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin',    label: 'Admin',    description: 'Gerencia produtos, equipe e relatórios' },
  { value: 'operator', label: 'Operador', description: 'Registra entradas, saídas e move estoque' },
  { value: 'viewer',   label: 'Visualizador', description: 'Só visualiza, sem alterar dados' },
]

interface InviteUserModalProps {
  onClose:   () => void
  onSuccess: () => void
}

export function InviteUserModal({ onClose, onSuccess }: InviteUserModalProps) {
  const [email, setEmail]       = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole]         = useState<UserRole>('operator')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('E-mail é obrigatório.'); return }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/invite-user`,
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ email: email.trim(), role, full_name: fullName.trim() || undefined }),
      },
    )

    const json = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(json.error ?? 'Erro ao enviar convite.')
    } else {
      onSuccess()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1A1C2E]">Convidar membro</h2>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#6B7280] text-xl">✕</button>
        </div>

        <form onSubmit={handleInvite} className="space-y-4">
          {error && (
            <div className="bg-[#FEE2E2] text-[#C05040] text-sm rounded-lg p-3">{error}</div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#6B7280]">Nome completo</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ana Silva"
              className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C8E8]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#6B7280]">E-mail *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ana@empresa.com"
              required
              className="w-full h-11 px-4 border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C8E8]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[#6B7280]">Permissão</label>
            {ROLE_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  role === opt.value
                    ? 'border-[#6D8FB0] bg-[#D4E8F5]'
                    : 'border-[#E5E7EB] hover:bg-[#F9FAFB]'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                  className="mt-0.5 accent-[#6D8FB0]"
                />
                <div>
                  <p className="text-sm font-semibold text-[#1A1C2E]">{opt.label}</p>
                  <p className="text-xs text-[#6B7280]">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 bg-[#6D8FB0] text-white rounded-xl text-sm font-semibold hover:bg-[#5A7A9A] transition-colors disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Enviar convite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
