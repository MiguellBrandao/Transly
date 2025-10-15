# Guia de Contribuição - Transly

Obrigado por considerar contribuir para o Transly! 🎉

## Como Contribuir

### Reportar Bugs

1. Verifique se o bug já foi reportado nas [Issues](https://github.com/seu-usuario/transly/issues)
2. Se não, crie uma nova issue com:
   - Título claro e descritivo
   - Passos para reproduzir o problema
   - Comportamento esperado vs. atual
   - Screenshots (se aplicável)
   - Informações do ambiente (OS, Node version, etc.)

### Sugerir Melhorias

1. Abra uma issue com o label `enhancement`
2. Descreva a funcionalidade desejada
3. Explique por que seria útil
4. Forneça exemplos de uso

### Pull Requests

1. **Fork o repositório**
2. **Crie um branch** para sua feature
   ```bash
   git checkout -b feature/MinhaNovaFeature
   ```

3. **Faça suas alterações**
   - Siga as convenções de código
   - Adicione testes se aplicável
   - Atualize a documentação

4. **Commit suas mudanças**
   ```bash
   git commit -m "feat: adiciona nova funcionalidade X"
   ```

5. **Push para o branch**
   ```bash
   git push origin feature/MinhaNovaFeature
   ```

6. **Abra um Pull Request**
   - Descreva as mudanças
   - Referencie issues relacionadas
   - Aguarde review

## Convenções de Código

### TypeScript/JavaScript

- Use TypeScript sempre que possível
- Nomeie variáveis e funções de forma descritiva
- Use camelCase para variáveis e funções
- Use PascalCase para componentes React e classes

### Commits

Siga o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Mudanças na documentação
- `style:` - Formatação, missing semi-colons, etc.
- `refactor:` - Refatoração de código
- `test:` - Adicionar testes
- `chore:` - Atualização de dependências, configuração, etc.

Exemplos:
```
feat: adiciona suporte para legendas SRT
fix: corrige erro ao exportar para DOCX
docs: atualiza guia de instalação
refactor: melhora performance do player de vídeo
```

### React Components

```typescript
// ✅ Bom
import { useState } from 'react';

interface MyComponentProps {
  title: string;
  onClose: () => void;
}

const MyComponent = ({ title, onClose }: MyComponentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div>
      <h1>{title}</h1>
    </div>
  );
};

export default MyComponent;
```

### API Routes

```typescript
// ✅ Bom
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = await fetchData(id);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

## Estrutura de Pastas

### Frontend
```
frontend/src/
├── components/     # Componentes reutilizáveis
├── pages/          # Páginas da aplicação
├── contexts/       # Context providers
├── hooks/          # Custom hooks
├── config/         # Configurações
├── i18n/           # Internacionalização
└── utils/          # Funções utilitárias
```

### Backend
```
backend/src/
├── routes/         # Rotas da API
├── controllers/    # Controllers (opcional)
├── services/       # Lógica de negócio
├── middleware/     # Middleware
├── config/         # Configurações
└── utils/          # Funções utilitárias
```

## Testes

### Frontend
```bash
cd frontend
npm test
```

### Backend
```bash
cd backend
npm test
```

## Internacionalização

Ao adicionar novo texto:

1. Adicione a chave em `frontend/src/i18n/locales/pt.json`
2. Adicione a tradução em `frontend/src/i18n/locales/en.json`
3. Use `t('chave')` no componente

Exemplo:
```typescript
// pt.json
{
  "myFeature": {
    "title": "Minha Feature",
    "description": "Descrição da feature"
  }
}

// en.json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description"
  }
}

// Component
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
<h1>{t('myFeature.title')}</h1>
```

## Checklist do Pull Request

- [ ] O código segue as convenções do projeto
- [ ] Comentários foram adicionados onde necessário
- [ ] A documentação foi atualizada
- [ ] As traduções foram adicionadas (PT e EN)
- [ ] Os testes passam
- [ ] Não há erros de linting
- [ ] Testei as mudanças localmente
- [ ] O commit message segue as convenções

## Dúvidas?

- Abra uma issue com a label `question`
- Entre em contato via [email]

## Código de Conduta

- Seja respeitoso e inclusivo
- Aceite feedback construtivo
- Foque no que é melhor para a comunidade
- Seja paciente com iniciantes

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a licença MIT do projeto.

---

Obrigado por contribuir! 🚀

