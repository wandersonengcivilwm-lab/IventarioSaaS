'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const PERIODS = [
  { label: '30 dias',  value: '30' },
  { label: '90 dias',  value: '90' },
  { label: '180 dias', value: '180' },
  { label: '1 ano',    value: '365' },
]

export function ABCFilters() {
  const router = useRouter()
  const params = useSearchParams()
  const current = params.get('days') ?? '90'

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-[#6B7280] font-medium">Período:</span>
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => router.push(`/dashboard/analytics?days=${p.value}`)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            current === p.value
              ? 'bg-[#6D8FB0] text-white'
              : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  )
}
