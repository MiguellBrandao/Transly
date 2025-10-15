# 🚀 Início Rápido - Transly

Guia rápido para ter o Transly funcionando em 5 minutos!

## ⚡ Pré-requisitos Mínimos

- Node.js 18+
- FFmpeg instalado
- Conta Supabase (gratuita)

## 📝 Passos Rápidos

### 1. Clonar e Instalar

```bash
git clone https://github.com/seu-usuario/transly.git
cd transly
```

### 2. Configurar Supabase (2 minutos)

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Vá em **SQL Editor** e execute o conteúdo de `supabase-schema.sql`
3. Vá em **Storage** > **Create Bucket** > Nome: `videos` > Public
4. Configure as políticas de storage (veja `SUPABASE_SETUP.md`)
5. Copie suas credenciais em **Settings** > **API**

### 3. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edite `backend/.env`:

```env
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_aqui
```

Inicie:

```bash
npm run dev
```

### 4. Frontend (nova aba do terminal)

```bash
cd frontend
npm install
cp .env.example .env
```

Edite `frontend/.env`:

```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
VITE_API_URL=http://localhost:3001
```

Inicie:

```bash
npm run dev
```

### 5. Testar! 🎉

1. Abra http://localhost:3000
2. Registre uma conta
3. Faça upload de um vídeo curto (MP4)
4. Aguarde o processamento
5. Veja a transcrição sincronizada!

## 🆘 Problemas Comuns

### FFmpeg não encontrado

**Windows:**

```powershell
winget install FFmpeg
```

**Mac:**

```bash
brew install ffmpeg
```

**Linux:**

```bash
sudo apt install ffmpeg
```

### Erro de CORS

Certifique-se que o backend está rodando em `http://localhost:3001`

### Vídeo não carrega

1. Verifique se o bucket `videos` existe no Supabase
2. Confirme que as políticas de storage estão configuradas
3. Veja o console do navegador para erros

### Transcrição demora muito

A primeira vez demora mais (download do modelo Whisper ~300MB). Tenha paciência!

## 📚 Próximos Passos

- Leia a [documentação completa](./INSTALLATION.md)
- Veja o [guia de deploy](./DEPLOYMENT.md)
- Configure para [produção](./SUPABASE_SETUP.md)

## 💡 Dicas

- Use vídeos curtos (~1-2 min) para testar
- O modelo Whisper funciona melhor com áudio claro
- Dark mode: clique no ícone de lua/sol na sidebar
- Idioma: clique no ícone do globo (PT/EN)

---

**Problemas?** Abra uma [issue no GitHub](https://github.com/seu-usuario/transly/issues)

