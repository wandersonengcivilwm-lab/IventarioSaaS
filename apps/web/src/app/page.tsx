import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { LandingNav } from '@/components/landing/LandingNav'

const FEATURES = [
  {
    emoji: '📷',
    title: 'QR Code por produto',
    desc:  'Cada produto tem um QR Code exclusivo. Escaneie e registre entradas e saídas em segundos, sem digitar nada.',
    bg:    '#D4E8F5',
  },
  {
    emoji: '⚡',
    title: 'Tempo real',
    desc:  'Saldo atualizado instantaneamente para toda a equipe. Sem planilhas, sem retrabalho.',
    bg:    '#D4F0DA',
  },
  {
    emoji: '📶',
    title: 'Funciona offline',
    desc:  'Sem internet? Sem problema. O app continua funcionando e sincroniza tudo quando reconectar.',
    bg:    '#F9F3D0',
  },
  {
    emoji: '📊',
    title: 'Curva ABC automática',
    desc:  'Descubra quais produtos representam 80% do seu valor. Foque onde realmente importa.',
    bg:    '#F5D4E8',
  },
  {
    emoji: '📋',
    title: 'Kanban de fluxo',
    desc:  'Acompanhe solicitações e pedidos com um quadro visual. Arraste cards entre etapas no celular.',
    bg:    '#E8E4F8',
  },
  {
    emoji: '👥',
    title: 'Multi-usuário',
    desc:  'Convide sua equipe com permissões distintas: owner, admin, operador ou visualizador.',
    bg:    '#FFECD2',
  },
]

const STEPS = [
  {
    num:   '01',
    title: 'Cadastre seus produtos',
    desc:  'Adicione produtos com nome, unidade, custo e estoque mínimo. O QR Code é gerado automaticamente.',
    emoji: '📦',
  },
  {
    num:   '02',
    title: 'Escaneie e registre',
    desc:  'Use o celular para escanear o QR, selecione entrada ou saída e confirme. Menos de 5 segundos.',
    emoji: '📷',
  },
  {
    num:   '03',
    title: 'Analise e otimize',
    desc:  'Dashboard com Curva ABC, alertas de estoque baixo, relatórios CSV/PDF e histórico completo.',
    emoji: '📈',
  },
]

const PRICING = [
  {
    name:    'Grátis',
    price:   'R$ 0',
    period:  '/mês',
    sub:     'Para começar',
    features: [
      '1 usuário',
      'Até 100 produtos',
      '1 depósito',
      'QR Code & movimentações',
      'Dashboard básico',
    ],
    cta:     'Criar conta grátis',
    href:    '/auth/register',
    highlight: false,
  },
  {
    name:    'Pro',
    price:   'R$ 49',
    period:  '/mês',
    sub:     'Para equipes',
    features: [
      '5 usuários',
      'Produtos ilimitados',
      '3 depósitos',
      'Curva ABC & Kanban',
      'Relatórios CSV + PDF',
      'Notificações push',
    ],
    cta:     'Assinar Pro',
    href:    '/auth/register',
    highlight: true,
  },
  {
    name:    'Enterprise',
    price:   'R$ 199',
    period:  '/mês',
    sub:     'Para empresas',
    features: [
      'Usuários ilimitados',
      'Produtos ilimitados',
      'Depósitos ilimitados',
      'API de integração',
      'SLA e suporte dedicado',
      'Onboarding personalizado',
    ],
    cta:     'Falar com equipe',
    href:    '/auth/register',
    highlight: false,
  },
]

const TESTIMONIALS = [
  {
    name:    'Carlos Mendes',
    company: 'Ferragem Boa Vista',
    text:    'Antes eu usava planilha e vivia com estoque errado. Com o EstoqueApp, em 10 minutos já cadastrei tudo e minha equipe já estava usando no celular.',
    avatar:  'C',
    color:   '#D4E8F5',
  },
  {
    name:    'Ana Paula Reis',
    company: 'Restaurante Sabor & Arte',
    text:    'O escaneamento de QR Code mudou nossa vida. Saída de insumos que demorava 5 minutos agora é questão de segundos. Sem erro.',
    avatar:  'A',
    color:   '#D4F0DA',
  },
  {
    name:    'Roberto Silva',
    company: 'Distribuidora RB',
    text:    'A Curva ABC me mostrou que 6 produtos representavam 78% do meu giro. Nunca mais fiquei sem esses itens no estoque.',
    avatar:  'R',
    color:   '#F9F3D0',
  },
]

export default async function LandingPage() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {
    // Sem credenciais configuradas — mostra landing para visitante
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-sans">
      <LandingNav isLoggedIn={isLoggedIn} />

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#D4F0DA] text-[#166534] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            100% gratuito para começar — sem cartão de crédito
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-[#1A1C2E] leading-tight tracking-tight mb-6">
            Controle de estoque{' '}
            <span className="text-[#6D8FB0]">inteligente</span>{' '}
            para pequenas empresas
          </h1>

          <p className="text-lg md:text-xl text-[#6B7280] max-w-2xl mx-auto mb-10 leading-relaxed">
            QR Code, tempo real, offline e Curva ABC num app mobile simples.
            Chega de planilha, chega de furo no estoque.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={isLoggedIn ? '/dashboard' : '/auth/register'}
              className="inline-flex items-center justify-center gap-2 bg-[#6D8FB0] text-white px-8 py-4 rounded-2xl text-base font-bold hover:bg-[#5A7A9A] transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              {isLoggedIn ? 'Abrir dashboard →' : 'Começar grátis →'}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 border-2 border-[#E5E7EB] text-[#1A1C2E] px-8 py-4 rounded-2xl text-base font-semibold hover:bg-white hover:border-[#A8C8E8] transition-all"
            >
              Ver como funciona ↓
            </a>
          </div>

          {/* Social proof mini */}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-[#9CA3AF]">
            {[
              { label: 'empresas ativas', value: '500+' },
              { label: 'produtos cadastrados', value: '50k+' },
              { label: 'movimentações/dia', value: '10k+' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-lg font-bold text-[#1A1C2E]">{stat.value}</p>
                <p className="text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* App mockup placeholder */}
        <div className="max-w-5xl mx-auto mt-16 bg-white rounded-3xl border border-[#E5E7EB] shadow-xl overflow-hidden">
          <div className="bg-[#F3F4F6] px-4 py-3 flex items-center gap-2 border-b border-[#E5E7EB]">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-[#E8B0A8]" />
              <span className="w-3 h-3 rounded-full bg-[#F2E8A8]" />
              <span className="w-3 h-3 rounded-full bg-[#A8D8B0]" />
            </div>
            <span className="flex-1 text-center text-xs text-[#9CA3AF]">estoqueapp.com.br/dashboard</span>
          </div>
          <div className="grid grid-cols-4 divide-x divide-[#F3F4F6]">
            {[
              { emoji: '📦', label: '247', sub: 'Produtos ativos',  bg: '#D4E8F5' },
              { emoji: '💰', label: 'R$ 84k', sub: 'Valor em estoque', bg: '#D4F0DA' },
              { emoji: '⚠️', label: '3',     sub: 'Estoque baixo',   bg: '#FEE2E2' },
              { emoji: '🔄', label: '18',    sub: 'Movim. hoje',     bg: '#F9F3D0' },
            ].map(card => (
              <div key={card.sub} className="p-5" style={{ backgroundColor: card.bg }}>
                <p className="text-2xl mb-1">{card.emoji}</p>
                <p className="text-xl font-bold text-[#1A1C2E]">{card.label}</p>
                <p className="text-xs text-[#6B7280]">{card.sub}</p>
              </div>
            ))}
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <div className="bg-[#F9FAFB] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase mb-3">Curva ABC — Top produtos</p>
              {[
                { name: 'Farinha de trigo', value: '32%', cls: 'A', bg: '#D4F0DA', text: '#5A9468' },
                { name: 'Óleo de soja',     value: '18%', cls: 'A', bg: '#D4F0DA', text: '#5A9468' },
                { name: 'Açúcar cristal',   value: '11%', cls: 'B', bg: '#F9F3D0', text: '#C8A840' },
                { name: 'Sal refinado',     value: '6%',  cls: 'C', bg: '#F5D8D4', text: '#C05040' },
              ].map(item => (
                <div key={item.name} className="flex items-center gap-3 py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1C2E] truncate">{item.name}</p>
                    <div className="h-1.5 bg-[#E5E7EB] rounded-full mt-1">
                      <div className="h-1.5 rounded-full" style={{ width: item.value, backgroundColor: item.text + '99' }} />
                    </div>
                  </div>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: item.bg, color: item.text }}>
                    {item.cls}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-[#F9FAFB] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#9CA3AF] uppercase mb-3">Últimas movimentações</p>
              {[
                { type: '📥', prod: 'Farinha trigo',  qty: '+50 kg',  color: '#5A9468' },
                { type: '📤', prod: 'Óleo de soja',   qty: '-12 l',   color: '#C05040' },
                { type: '📤', prod: 'Açúcar cristal', qty: '-8 kg',   color: '#C05040' },
                { type: '📥', prod: 'Sal refinado',   qty: '+30 kg',  color: '#5A9468' },
              ].map((tx, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 text-xs">
                  <span>{tx.type}</span>
                  <span className="flex-1 text-[#1A1C2E] truncate">{tx.prod}</span>
                  <span className="font-bold" style={{ color: tx.color }}>{tx.qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1C2E] mb-4">
              Tudo que você precisa, nada do que não precisa
            </h2>
            <p className="text-[#6B7280] max-w-xl mx-auto">
              Desenvolvido para a realidade de pequenas empresas brasileiras.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feat => (
              <div
                key={feat.title}
                className="rounded-2xl p-6 transition-all hover:shadow-md hover:-translate-y-0.5"
                style={{ backgroundColor: feat.bg }}
              >
                <span className="text-3xl mb-4 block">{feat.emoji}</span>
                <h3 className="text-base font-bold text-[#1A1C2E] mb-2">{feat.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1C2E] mb-4">
              Simples de usar. Poderoso por dentro.
            </h2>
            <p className="text-[#6B7280]">Comece a usar em menos de 10 minutos.</p>
          </div>
          <div className="space-y-8">
            {STEPS.map((step, i) => (
              <div key={step.num} className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#6D8FB0] text-white flex items-center justify-center text-lg font-black">
                  {step.num}
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{step.emoji}</span>
                    <h3 className="text-lg font-bold text-[#1A1C2E]">{step.title}</h3>
                  </div>
                  <p className="text-[#6B7280] leading-relaxed">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="absolute left-7 mt-14 w-0.5 h-8 bg-[#E5E7EB]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-[#6D8FB0]">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {[
            { value: '< 5s',  label: 'para registrar uma movimentação via QR' },
            { value: '100%',  label: 'funciona offline, sincroniza depois' },
            { value: '3',     label: 'tipos de relatório (transações, estoque, ABC)' },
            { value: '0',     label: 'planilhas necessárias' },
          ].map(stat => (
            <div key={stat.value}>
              <p className="text-3xl md:text-4xl font-extrabold mb-2">{stat.value}</p>
              <p className="text-sm text-[#D4E8F5]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ──────────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1C2E] mb-4">
              Preços transparentes
            </h2>
            <p className="text-[#6B7280]">Comece grátis. Cresça conforme precisar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 flex flex-col ${
                  plan.highlight
                    ? 'bg-[#6D8FB0] text-white shadow-xl scale-105 ring-4 ring-[#A8C8E8]'
                    : 'bg-[#F9FAFB] border border-[#E5E7EB]'
                }`}
              >
                {plan.highlight && (
                  <span className="self-start text-xs font-bold bg-white text-[#6D8FB0] px-2.5 py-1 rounded-full mb-4">
                    Mais popular
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? 'text-white' : 'text-[#1A1C2E]'}`}>
                  {plan.name}
                </h3>
                <p className={`text-xs mb-4 ${plan.highlight ? 'text-[#D4E8F5]' : 'text-[#9CA3AF]'}`}>
                  {plan.sub}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-white' : 'text-[#1A1C2E]'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-[#D4E8F5]' : 'text-[#9CA3AF]'}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(feat => (
                    <li key={feat} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-white' : 'text-[#6B7280]'}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        plan.highlight ? 'bg-white/20 text-white' : 'bg-[#D4F0DA] text-[#5A9468]'
                      }`}>
                        ✓
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlight
                      ? 'bg-white text-[#6D8FB0] hover:bg-[#F0F7FF]'
                      : 'bg-[#6D8FB0] text-white hover:bg-[#5A7A9A]'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[#9CA3AF] mt-8">
            Todos os planos incluem SSL, backup diário e suporte por email.
          </p>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1A1C2E] text-center mb-14">
            Empresas que já controlam melhor
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-sm">
                <p className="text-[#6B7280] text-sm leading-relaxed mb-6">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-[#1A1C2E]"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1A1C2E]">{t.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#1A1C2E]">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-5xl mb-6 block">📦</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Chega de planilha. Comece agora.
          </h2>
          <p className="text-[#9CA3AF] mb-10 text-lg">
            Crie sua conta grátis em menos de 2 minutos. Sem cartão de crédito.
          </p>
          <Link
            href={isLoggedIn ? '/dashboard' : '/auth/register'}
            className="inline-flex items-center gap-2 bg-[#A8C8E8] text-[#1A1C2E] px-10 py-5 rounded-2xl text-base font-bold hover:bg-[#D4E8F5] transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            {isLoggedIn ? 'Abrir dashboard →' : 'Criar conta grátis →'}
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-[#E5E7EB] bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📦</span>
            <span className="font-bold text-[#1A1C2E]">EstoqueApp</span>
          </div>
          <div className="flex gap-6 text-sm text-[#9CA3AF]">
            <a href="#features"    className="hover:text-[#6B7280]">Funcionalidades</a>
            <a href="#pricing"     className="hover:text-[#6B7280]">Preços</a>
            <Link href="/auth/login"    className="hover:text-[#6B7280]">Entrar</Link>
            <Link href="/auth/register" className="hover:text-[#6B7280]">Cadastrar</Link>
          </div>
          <p className="text-xs text-[#9CA3AF]">© 2026 EstoqueApp. Feito com 💙 no Brasil.</p>
        </div>
      </footer>
    </div>
  )
}
