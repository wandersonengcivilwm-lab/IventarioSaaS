'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InviteUserModal } from './InviteUserModal'

type UserRole = 'owner' | 'admin' | 'operator' | 'viewer'

const ROLE_LABELS: Record<UserRole, string> = {
  owner:    'Owner',
  admin:    'Admin',
  operator: 'Operador',
  viewer:   'Visualizador',
}

const ROLE_COLORS: Record<UserRole, { bg: string; text: string }> = {
  owner:    { bg: '#E8E4F8', text: '#6B46C1' },
  admin:    { bg: '#D4E8F5', text: '#1D4ED8' },
  operator: { bg: '#D4F0DA', text: '#166534' },
  viewer:   { bg: '#F3F4F6', text: '#6B7280' },
}

interface TeamMember {
  id:         string
  full_name:  string
  role:       UserRole
  is_active:  boolean
  last_seen_at: string | null
  auth_email?: string
}

interface TeamActionsProps {
  members:       TeamMember[]
  currentUserId: string
  currentRole:   UserRole
}

export function TeamActions({ members, currentUserId, currentRole }: TeamActionsProps) {
  const router                      = useRouter()
  const [showInvite, setShowInvite] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const canInvite     = ['owner', 'admin'].includes(currentRole)
  const canChangeRole = currentRole === 'owner'
  const canDeactivate = ['owner', 'admin'].includes(currentRole)

  async function handleRoleChange(userId: string, newRole: UserRole) {
    if (!canChangeRole || userId === currentUserId) return
    setUpdatingId(userId)
    const supabase = createClient()
    await supabase.from('users').update({ role: newRole }).eq('id', userId)
    setUpdatingId(null)
    router.refresh()
  }

  async function handleToggleActive(userId: string, isActive: boolean) {
    if (!canDeactivate || userId === currentUserId) return
    setUpdatingId(userId)
    const supabase = createClient()
    await supabase.from('users').update({ is_active: !isActive }).eq('id', userId)
    setUpdatingId(null)
    router.refresh()
  }

  return (
    <>
      {/* Header com botão de convite */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1C2E]">Equipe</h1>
          <p className="text-[#6B7280] mt-1">{members.length} membro{members.length !== 1 ? 's' : ''}</p>
        </div>
        {canInvite && (
          <button
            onClick={() => setShowInvite(true)}
            className="bg-[#6D8FB0] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#5A7A9A] transition-colors"
          >
            + Convidar membro
          </button>
        )}
      </div>

      {/* Tabela de membros */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#F3F4F6]">
              {['Membro', 'Permissão', 'Status', 'Última atividade', 'Ações'].map(h => (
                <th key={h} className="text-left text-xs text-[#9CA3AF] font-medium uppercase tracking-wide px-5 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F9FAFB]">
            {members.map(member => {
              const rc = ROLE_COLORS[member.role]
              const isMe = member.id === currentUserId

              return (
                <tr key={member.id} className={`hover:bg-[#FAFAF8] transition-colors ${!member.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#D4E8F5] flex items-center justify-center text-sm font-bold text-[#6D8FB0]">
                        {member.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <p className="font-medium text-[#1A1C2E]">
                          {member.full_name}
                          {isMe && <span className="ml-2 text-xs text-[#9CA3AF]">(você)</span>}
                        </p>
                        {member.auth_email && (
                          <p className="text-xs text-[#9CA3AF]">{member.auth_email}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {canChangeRole && !isMe && member.role !== 'owner' ? (
                      <select
                        value={member.role}
                        onChange={e => handleRoleChange(member.id, e.target.value as UserRole)}
                        disabled={!!updatingId}
                        className="text-xs border border-[#E5E7EB] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#A8C8E8]"
                        style={{ backgroundColor: rc.bg, color: rc.text }}
                      >
                        <option value="admin">Admin</option>
                        <option value="operator">Operador</option>
                        <option value="viewer">Visualizador</option>
                      </select>
                    ) : (
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: rc.bg, color: rc.text }}
                      >
                        {ROLE_LABELS[member.role]}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${member.is_active ? 'text-[#166534]' : 'text-[#9CA3AF]'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${member.is_active ? 'bg-[#22C55E]' : 'bg-[#D1D5DB]'}`} />
                      {member.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#9CA3AF] text-xs">
                    {member.last_seen_at
                      ? new Date(member.last_seen_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'Nunca'}
                  </td>
                  <td className="px-5 py-4">
                    {canDeactivate && !isMe && member.role !== 'owner' && (
                      <button
                        onClick={() => handleToggleActive(member.id, member.is_active)}
                        disabled={!!updatingId}
                        className="text-xs text-[#6B7280] hover:text-[#C05040] transition-colors disabled:opacity-50"
                      >
                        {member.is_active ? 'Desativar' : 'Reativar'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* RBAC info */}
      <div className="mt-6 bg-[#F9FAFB] rounded-xl p-4 text-sm text-[#6B7280]">
        <p className="font-semibold text-[#1A1C2E] mb-2">Tabela de permissões</p>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {[
            { action: 'Ver produtos/estoque',   owner: true, admin: true, operator: true, viewer: true },
            { action: 'Criar/editar produtos',  owner: true, admin: true, operator: true, viewer: false },
            { action: 'Excluir produtos',       owner: true, admin: true, operator: false, viewer: false },
            { action: 'Registrar movimentações',owner: true, admin: true, operator: true, viewer: false },
            { action: 'Gerenciar equipe',       owner: true, admin: true, operator: false, viewer: false },
            { action: 'Exportar relatórios',    owner: true, admin: true, operator: false, viewer: false },
            { action: 'Configurações do tenant',owner: true, admin: false, operator: false, viewer: false },
          ].map(row => (
            <div key={row.action} className="contents">
              <span className="col-span-1 text-[#6B7280]">{row.action}</span>
              {(['owner', 'admin', 'operator', 'viewer'] as const).map(r => (
                <span key={r} className={`text-center ${(row as any)[r] ? 'text-[#166534]' : 'text-[#D1D5DB]'}`}>
                  {(row as any)[r] ? '✓' : '—'}
                </span>
              ))}
            </div>
          ))}
          <div className="contents font-semibold text-[#1A1C2E]">
            <span></span>
            {['Owner', 'Admin', 'Operador', 'Viewer'].map(r => (
              <span key={r} className="text-center">{r}</span>
            ))}
          </div>
        </div>
      </div>

      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  )
}
