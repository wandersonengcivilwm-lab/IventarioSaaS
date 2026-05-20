# Deploy — EstoqueApp

## 1. Criar projeto no Supabase (obrigatório para autenticação)

1. Acesse [supabase.com](https://supabase.com) e clique em **New project**
2. Escolha organização → nome do projeto (ex: `estoque-app`) → senha do banco → região (South America)
3. Aguarde 2 minutos para provisionar
4. Vá em **Settings → API** e copie:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (mantenha secreto!)

5. Aplique as migrations:
```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

## 2. Deploy no Vercel

### Opção A — Via CLI (terminal do Windows)

Abra o **PowerShell** ou **Terminal** e execute:

```bash
# Login no Vercel (abre browser para autenticação)
vercel login

# Ir para o diretório web
cd D:\HashTag\Claude\inventory-saas\apps\web

# Deploy de produção
vercel --prod
```

Durante o `vercel` inicial, responda:
- **Set up and deploy?** → Y
- **Which scope?** → sua conta pessoal
- **Link to existing project?** → N
- **Project name?** → estoque-app (ou outro nome)
- **Directory?** → ./ (enter)
- **Auto-detected Next.js** → Y

### Opção B — Via GitHub (recomendado para produção)

1. Crie um repositório no GitHub e faça push do projeto:
```bash
cd D:\HashTag\Claude\inventory-saas
git init
git add .
git commit -m "Initial commit — EstoqueApp"
git remote add origin https://github.com/SEU_USUARIO/estoque-app.git
git push -u origin main
```

2. Acesse [vercel.com/new](https://vercel.com/new)
3. Importe o repositório do GitHub
4. Configure:
   - **Root Directory**: `apps/web`
   - **Framework**: Next.js (auto-detectado)
   - **Build Command**: `cd ../.. && pnpm --filter @inventory-saas/web build`
   - **Install Command**: `cd ../.. && pnpm install`

## 3. Configurar variáveis de ambiente no Vercel

Após o deploy, vá em **Settings → Environment Variables** e adicione:

| Variável | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxx.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJ... |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJ... (somente Production) |

Clique em **Redeploy** após salvar as variáveis.

## 4. Resultado esperado

Após o deploy você terá:
- **Landing page**: `https://estoque-app.vercel.app`
- **Login**: `https://estoque-app.vercel.app/auth/login`
- **Dashboard**: `https://estoque-app.vercel.app/dashboard`
- **URL personalizada**: configure em Vercel → Domains
