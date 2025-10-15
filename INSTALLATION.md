# Guia de Instalação - Transly

Este guia irá ajudá-lo a configurar e executar o Transly localmente.

## Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** ou **yarn**
- **FFmpeg** ([Download](https://ffmpeg.org/download.html))
- **Git**
- **Conta Supabase** (gratuita) ([Criar conta](https://supabase.com))

### Instalar FFmpeg

#### Windows
1. Baixe o FFmpeg de [https://ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Extraia o arquivo ZIP
3. Adicione a pasta `bin` ao PATH do sistema

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

## Passo 1: Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/transly.git
cd transly
```

## Passo 2: Configurar Supabase

Siga o guia completo em [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) para:

1. Criar um projeto Supabase
2. Executar o schema SQL
3. Criar o bucket de storage
4. Configurar políticas de segurança
5. Obter as credenciais da API

## Passo 3: Configurar Backend

### Instalar dependências

```bash
cd backend
npm install
```

### Configurar variáveis de ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env` com suas credenciais do Supabase:
```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Storage
UPLOAD_DIR=uploads
TEMP_DIR=temp
```

### Executar o backend

```bash
npm run dev
```

O backend estará rodando em `http://localhost:3001`

## Passo 4: Configurar Frontend

### Instalar dependências

Abra um novo terminal:

```bash
cd frontend
npm install
```

### Configurar variáveis de ambiente

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite o arquivo `.env`:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon
VITE_API_URL=http://localhost:3001
```

### Executar o frontend

```bash
npm run dev
```

O frontend estará rodando em `http://localhost:3000`

## Passo 5: Testar a Aplicação

1. Abra o navegador em `http://localhost:3000`
2. Crie uma nova conta
3. Faça login
4. Teste o upload de um vídeo curto
5. Aguarde a transcrição ser processada
6. Visualize o vídeo com a transcrição sincronizada

## Estrutura do Projeto

```
transly/
├── backend/              # API Node.js + Express
│   ├── src/
│   │   ├── routes/      # Rotas da API
│   │   ├── services/    # Lógica de negócio
│   │   ├── middleware/  # Middleware de autenticação
│   │   └── config/      # Configurações
│   └── package.json
├── frontend/            # App React
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── contexts/    # Context providers
│   │   ├── config/      # Configurações
│   │   └── i18n/        # Internacionalização
│   └── package.json
├── supabase-schema.sql  # Schema do banco de dados
└── README.md
```

## Scripts Disponíveis

### Backend

- `npm run dev` - Executa em modo de desenvolvimento
- `npm run build` - Compila TypeScript para JavaScript
- `npm start` - Executa a versão compilada

### Frontend

- `npm run dev` - Executa em modo de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Visualiza o build de produção

## Resolução de Problemas

### Erro: FFmpeg não encontrado
- Verifique se o FFmpeg está instalado e no PATH
- Execute `ffmpeg -version` no terminal para confirmar

### Erro: Falha ao conectar ao Supabase
- Verifique se as credenciais em `.env` estão corretas
- Confirme que o projeto Supabase está ativo
- Verifique a conexão com a internet

### Erro: Vídeo não carrega
- Verifique se o bucket `videos` existe no Supabase Storage
- Confirme que as políticas de storage estão configuradas
- Verifique o console do navegador para erros CORS

### Transcrição não funciona
- A primeira execução pode demorar (download do modelo Whisper)
- Verifique os logs do backend para erros
- Certifique-se de que há espaço em disco suficiente

### Erro de porta já em uso
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3001 | xargs kill -9
```

## Desenvolvimento

### Adicionar novas traduções

Edite os arquivos em `frontend/src/i18n/locales/`:
- `pt.json` - Português
- `en.json` - Inglês

### Modificar o schema do banco

1. Edite `supabase-schema.sql`
2. Execute as alterações no SQL Editor do Supabase
3. Ou use migrações Supabase se estiver usando CLI

### Alterar limites de upload

Em `backend/src/routes/video.routes.ts`:
```typescript
limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
```

## Próximos Passos

- [ ] Configurar domínio personalizado
- [ ] Implementar testes automatizados
- [ ] Adicionar mais idiomas
- [ ] Melhorar performance da transcrição
- [ ] Implementar sistema de notificações
- [ ] Adicionar suporte a legendas (SRT, VTT)

## Suporte

Para problemas ou dúvidas:
1. Verifique a seção de [Resolução de Problemas](#resolução-de-problemas)
2. Consulte a documentação do [Supabase](https://supabase.com/docs)
3. Abra uma issue no GitHub

## Licença

MIT - Veja o arquivo LICENSE para detalhes

