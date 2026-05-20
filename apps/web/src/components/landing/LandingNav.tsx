'use client'

import { useState } from 'react'
import Link from 'next/link'

interface LandingNavProps {
  isLoggedIn: boolean
}

export function LandingNav({ isLoggedIn }: LandingNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-2xl">📦</span>
          <span className="text-lg font-bold text-[#1A1C2E]">EstoqueApp</span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#6B7280]">
          {[
            { label: 'Funcionalidades', href: '#features' },
            { label: 'Como funciona',   href: '#how-it-works' },
            { label: 'Preços',          href: '#pricing' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              className="hover:text-[#1A1C2E] transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="bg-[#6D8FB0] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#5A7A9A] transition-colors"
            >
              Ir para o dashboard →
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden md:block text-sm font-medium text-[#6B7280] hover:text-[#1A1C2E] transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="bg-[#6D8FB0] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#5A7A9A] transition-colors"
              >
                Começar grátis
              </Link>
            </>
          )}

          {/* Hamburguer mobile */}
          <button
            className="md:hidden p-1 text-[#6B7280]"
            onClick={() => setMenuOpen(o => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white px-6 py-4 space-y-3">
          {[
            { label: 'Funcionalidades', href: '#features' },
            { label: 'Como funciona',   href: '#how-it-works' },
            { label: 'Preços',          href: '#pricing' },
          ].map(item => (
            <a
              key={item.label}
              href={item.href}
              className="block text-sm text-[#6B7280] hover:text-[#1A1C2E]"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          {!isLoggedIn && (
            <Link href="/auth/login" className="block text-sm text-[#6B7280]">
              Entrar
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
