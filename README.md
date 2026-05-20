# EstoqueApp — Controle Inteligente de Estoque

SaaS mobile-first para pequenas empresas gerenciarem estoques com QR Code, Kanban e Curva ABC.

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Monorepo | Turborepo + pnpm |
| Mobile | Expo SDK 52 (React Native) |
| Web | Next.js 14 App Router |
| Banco | Supabase (PostgreSQL + RLS + Realtime) |
| Offline | WatermelonDB |
| QR Scan | react-native-vision-camera |
| Notificações | Expo Notifications + Firebase FCM v1 |
| Deploy | Vercel + EAS Build + Supabase Cloud |

## Estrutura

```
inventory-saas/
├── apps/
│   ├── mobile/    # App Expo (interface principal)
│   └── web/       # Dashboard Next.js + landing page
├── packages/
│   ├── shared/    # Tipos, algoritmo ABC, permissões, formatters
│   └── config/    # Configs compartilhadas (TS, ESLint, Prettier)
└── supabase/
    ├── migrations/   # Schema + RLS + Realtime
    └── functions/    # Edge Functions (push, QR, export, convites)
```

## Primeiros passos

### 1. Pré-requisitos (instalar antes de tudo)

- **Node.js >= 20** → [nodejs.org/download](https://nodejs.org/download) (baixe o instalador LTS)
- **pnpm >= 9**: após instalar Node.js, abra o terminal e execute:
  ```bash
  npm install -g pnpm
  ```
- **Supabase CLI**: `npm install -g supabase`
- **EAS CLI** (para builds mobile): `npm install -g eas-cli`

> ⚠️ Confirme que o Node.js está no PATH: `node --version` deve retornar `v20.x.x` ou superior.

### 2. Instalar dependências
```bash
cd D:\HashTag\Claude\inventory-saas
pnpm install
```

### 3. Configurar variáveis de ambiente
```bash
copy .env.example .env
```
Edite `.env` e preencha com suas credenciais do Supabase (crie um projeto gratuito em [supabase.com](https://supabase.com)):
```
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_ANON_KEY=sua_anon_key
...
```

### 4. Inicializar o banco de dados

**Opção A: Supabase Cloud (recomendado para começar)**
```bash
# Instalar CLI e fazer login
supabase login

# Vincular ao projeto criado no dashboard
supabase link --project-ref SEU_PROJECT_REF

# Aplicar todas as migrations
supabase db push
```

**Opção B: Supabase local (Docker necessário)**
```bash
supabase start
supabase db reset
```

### 5. Gerar tipos TypeScript do Supabase
```bash
supabase gen types typescript --linked > apps/mobile/src/types/database.ts
```

### 6. Iniciar o dashboard web
```bash
# Apenas web (abre em http://localhost:3000)
pnpm --filter @inventory-saas/web dev

# Ou todos os apps juntos
pnpm dev
```

### 7. Iniciar o app mobile
```bash
cd apps/mobile

# Expo Go (funciona para telas sem câmera nativa)
npx expo start

# Build de desenvolvimento (necessário para QR scanner com VisionCamera)
eas build --profile development --platform android
# Em seguida: npx expo start --dev-client
```

## Milestones

| # | Feature | Status |
|---|---|---|
| M1 | Fundação: monorepo, Supabase, auth | ✅ Completo |
| M2 | CRUD mobile: produtos + transações | 🔜 Próximo |
| M3 | Escaneamento QR Code | 🔜 |
| M4 | Dashboard + Curva ABC | 🔜 |
| M5 | Kanban drag-and-drop | 🔜 |
| M6 | Multi-usuário + permissões | 🔜 |
| M7 | Notificações push | 🔜 |
| M8 | Relatórios e exportação | 🔜 |
| M9 | Landing page | 🔜 |

## Roles de usuário

| Ação | owner | admin | operator | viewer |
|---|:---:|:---:|:---:|:---:|
| Ver produtos/estoque | ✅ | ✅ | ✅ | ✅ |
| Criar/editar produtos | ✅ | ✅ | ✅ | ❌ |
| Registrar movimentações | ✅ | ✅ | ✅ | ❌ |
| Excluir produtos | ✅ | ✅ | ❌ | ❌ |
| Gerenciar equipe | ✅ | ✅ | ❌ | ❌ |
| Exportar relatórios | ✅ | ✅ | ❌ | ❌ |
| Configurações do tenant | ✅ | ❌ | ❌ | ❌ |
