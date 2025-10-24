# Backend API - E-commerce Products

API REST minimalista com Hono e SQLite para cadastro e listagem de produtos.

## Setup

```bash
# Instalar dependências
bun install

# Iniciar servidor de desenvolvimento
bun run dev

# Build para produção
bun run build

# Executar versão compilada
bun run start

# Executar testes
bun test

# Executar testes em modo watch
bun test:watch
```

## Configuração

Crie um arquivo `.env` na raiz do backend:

```env
PORT=3005
DATABASE_URL=./data/database.sqlite
```

## API Endpoints

### Health Check

```
GET /health
```

### Produtos

#### Criar Produto

```
POST /api/products
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "price": number,
  "sku": "string"
}
```

#### Listar Produtos

```
GET /api/products
```

#### Buscar Produto por ID

```
GET /api/products/:id
```

#### Imagens do Produto (MVP)

As imagens são armazenadas localmente em `backend/uploads/products` e servidas estaticamente via `GET /uploads/...`.

```
GET    /api/products/:id/images              # Lista imagens do produto
POST   /api/products/:id/images              # Upload (multipart) múltiplas imagens
DELETE /api/products/:id/images/:imageId     # Remove uma imagem (e arquivo local)
```

`POST /api/products/:id/images` (apenas multipart neste MVP):

```
Content-Type: multipart/form-data
Campo: images (pode enviar múltiplos arquivos)
```

Limites/validação:

- Até 5 arquivos por request
- Máx 5MB por arquivo
- Tipos suportados: image/jpeg, image/png, image/webp
- Nomes gerados com UUID; URLs relativas iniciando com `/uploads/products/...`

## Exemplos de Requests

### Criar um produto

```bash
curl -X POST http://localhost:3005/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notebook Dell XPS 13",
    "description": "Ultrabook premium com processador Intel Core i7",
    "price": 8999.99,
    "sku": "DELL-XPS-13-2024"
  }'
```

### Listar todos os produtos

```bash
curl http://localhost:3005/api/products
```

### Upload de imagens (multipart)

```bash
curl -X POST http://localhost:3005/api/products/<PRODUCT_ID>/images \\
  -F "images=@/caminho/da/imagem1.jpg" \\
  -F "images=@/caminho/da/imagem2.png"
```

## Modelo de Dados

```typescript
type Product = {
  id: string; // UUID gerado automaticamente
  name: string; // Nome do produto
  description: string; // Descrição do produto
  price: number; // Preço em decimal
  sku: string; // Código único do produto
  createdAt: string; // ISO 8601 timestamp
};
```

## Estrutura do Projeto

```
backend/
├── src/
│   ├── index.ts     # Servidor principal e configuração
│   ├── db.ts        # Configuração do SQLite e statements
│   └── products.ts  # Router e handlers dos produtos
├── data/
│   └── database.sqlite  # Banco de dados SQLite (criado automaticamente)
└── .env             # Variáveis de ambiente
```

## Características

- ✅ TypeScript com tipagem forte
- ✅ Validação de dados com Zod
- ✅ SQLite com queries preparadas (Bun:sqlite nativo)
- ✅ CORS habilitado para `http://localhost:5173`
- ✅ Bootstrapping automático do schema
- ✅ Tratamento de erros básico
- ✅ Respostas JSON consistentes
- ✅ Suite de testes completa com Bun Test

## Testes

A suite de testes de integração completa está em `src/products.test.ts` usando **Bun Test** nativo.

### Cobertura dos Testes:

**POST /api/products:**

- ✅ Criação de produto com sucesso (201)
- ✅ Validação de nome vazio (400)
- ✅ Validação de descrição ausente (400)
- ✅ Validação de preço negativo (400)
- ✅ Validação de preço zero (400)
- ✅ Validação de SKU vazio (400)
- ✅ Tratamento de SKU duplicado (400)

**GET /api/products:**

- ✅ Lista vazia quando não há produtos
- ✅ Lista todos os produtos cadastrados

**GET /api/products/:id:**

- ✅ Busca produto por ID existente
- ✅ Retorna 404 para ID inexistente

**CORS:**

- ✅ Headers CORS configurados corretamente

### Executar Testes:

```bash
# Rodar todos os testes
bun test

# Rodar apenas testes de produtos
bun test src/products.test.ts

# Modo watch
bun test --watch
```

**Resultado:** 12 testes | 45 assertions | ~35ms
