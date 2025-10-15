# Guia de Deploy - Transly

Este guia explica como fazer deploy do Transly em produção.

## Opções de Deploy

### Opção 1: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend no Vercel

1. **Criar conta no Vercel**
   - Acesse [vercel.com](https://vercel.com)
   - Faça login com GitHub

2. **Importar projeto**
   - Clique em "New Project"
   - Selecione seu repositório GitHub
   - Configure o root directory: `frontend`
   - Framework Preset: Vite

3. **Configurar variáveis de ambiente**
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anon
   VITE_API_URL=https://seu-backend.railway.app
   ```

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde o build completar

#### Backend no Railway

1. **Criar conta no Railway**
   - Acesse [railway.app](https://railway.app)
   - Faça login com GitHub

2. **Criar novo projeto**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo"
   - Escolha seu repositório

3. **Configurar root directory**
   - Settings > Service Settings
   - Root Directory: `backend`
   - Start Command: `npm start`
   - Build Command: `npm run build`

4. **Adicionar variáveis de ambiente**
   ```
   PORT=3001
   NODE_ENV=production
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua_chave_anon
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   UPLOAD_DIR=uploads
   TEMP_DIR=temp
   ```

5. **Deploy**
   - Railway fará deploy automaticamente
   - Copie a URL gerada (ex: `https://seu-backend.railway.app`)

### Opção 2: VPS (DigitalOcean, AWS, etc.)

#### Requisitos do Servidor

- Ubuntu 20.04+ ou similar
- 2GB RAM mínimo (4GB recomendado)
- 20GB+ de armazenamento
- Node.js 18+
- Nginx
- PM2
- FFmpeg

#### Setup do Servidor

1. **Conectar ao servidor**
```bash
ssh root@seu-servidor-ip
```

2. **Atualizar sistema**
```bash
apt update && apt upgrade -y
```

3. **Instalar Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

4. **Instalar FFmpeg**
```bash
apt install -y ffmpeg
```

5. **Instalar PM2**
```bash
npm install -g pm2
```

6. **Instalar Nginx**
```bash
apt install -y nginx
```

7. **Clonar repositório**
```bash
cd /var/www
git clone https://github.com/seu-usuario/transly.git
cd transly
```

8. **Configurar Backend**
```bash
cd backend
npm install
cp .env.example .env
nano .env  # Configure as variáveis
npm run build
```

9. **Iniciar Backend com PM2**
```bash
pm2 start dist/index.js --name transly-backend
pm2 save
pm2 startup
```

10. **Configurar Frontend**
```bash
cd ../frontend
npm install
cp .env.example .env
nano .env  # Configure as variáveis
npm run build
```

11. **Configurar Nginx**
```bash
nano /etc/nginx/sites-available/transly
```

Adicione:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        root /var/www/transly/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 500M;
    }
}
```

12. **Ativar site**
```bash
ln -s /etc/nginx/sites-available/transly /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

13. **Configurar SSL com Let's Encrypt**
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d seu-dominio.com
```

### Opção 3: Docker

#### Criar Dockerfiles

**backend/Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install FFmpeg
RUN apk add --no-cache ffmpeg

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

**frontend/Dockerfile**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/temp:/app/temp
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

#### Deploy com Docker

```bash
# Build e iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar
docker-compose down
```

## Configuração de Produção

### Supabase

1. **Upgrade para plano pago** (se necessário)
2. **Configurar domínio personalizado**
3. **Ativar backups automáticos**
4. **Configurar rate limiting**
5. **Revisar políticas de segurança**

### Backend

1. **Variáveis de ambiente**
   - Nunca commite `.env` para o repositório
   - Use variáveis de ambiente do serviço de hosting
   - Mantenha `SERVICE_ROLE_KEY` segura

2. **Limites de upload**
   - Ajuste conforme necessário
   - Configure timeout apropriado

3. **Logs**
   - Configure logging adequado
   - Use serviço de monitoramento (ex: Sentry)

4. **Segurança**
   - Ative HTTPS
   - Configure CORS adequadamente
   - Use rate limiting

### Frontend

1. **Build otimizado**
   ```bash
   npm run build
   ```

2. **Configure CDN** (opcional)
   - Cloudflare
   - AWS CloudFront

3. **Analytics** (opcional)
   - Google Analytics
   - Plausible

## Monitoramento

### PM2 Monitoring

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs transly-backend

# Reiniciar
pm2 restart transly-backend
```

### Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

## Backup

### Banco de Dados (Supabase)

1. Configure backups automáticos no dashboard
2. Exporte regularmente via API ou CLI

### Arquivos Uploaded

1. Configure backup do storage Supabase
2. Ou sincronize com S3/Google Cloud Storage

## Atualização

### Com Git

```bash
cd /var/www/transly
git pull origin main

# Backend
cd backend
npm install
npm run build
pm2 restart transly-backend

# Frontend
cd ../frontend
npm install
npm run build
```

## Checklist de Deploy

- [ ] Supabase configurado e funcional
- [ ] Variáveis de ambiente configuradas
- [ ] FFmpeg instalado
- [ ] SSL/HTTPS ativo
- [ ] CORS configurado
- [ ] Backups configurados
- [ ] Monitoramento ativo
- [ ] Logs funcionando
- [ ] Rate limiting configurado
- [ ] Testes de upload realizados
- [ ] Testes de transcrição realizados
- [ ] Domínio personalizado configurado
- [ ] Email de notificações configurado

## Custos Estimados

### Opção Vercel + Railway (Pequeno)
- Vercel: Gratuito
- Railway: $5-20/mês
- Supabase: Gratuito (ou $25/mês Pro)
- **Total: $5-45/mês**

### Opção VPS
- DigitalOcean Droplet (2GB): $12/mês
- Domínio: $10-15/ano
- Supabase: Gratuito (ou $25/mês Pro)
- **Total: $12-37/mês**

### Opção Docker + Cloud
- Google Cloud Run / AWS ECS: ~$20-50/mês
- Supabase: $25/mês Pro
- **Total: $45-75/mês**

## Troubleshooting em Produção

### Erro 502 Bad Gateway
- Verifique se o backend está rodando
- Confira logs do PM2 ou serviço
- Verifique configuração do Nginx

### Upload falha
- Aumente `client_max_body_size` no Nginx
- Verifique espaço em disco
- Confira políticas do Supabase Storage

### Transcrição lenta
- Considere usar OpenAI Whisper API (pago mas mais rápido)
- Upgrade do servidor (mais CPU/RAM)
- Implemente fila de processamento

## Suporte

Para problemas em produção:
1. Verifique logs do servidor
2. Teste conexão com Supabase
3. Verifique status dos serviços
4. Abra issue no GitHub se necessário

