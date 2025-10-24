<role>
Você é um engenheiro de software sênior. Vai implementar uma **tela de visualização/detalhes de produto** no frontend (React/Vite) do monorepo existente, integrando **TanStack Router** para navegação e consumindo os endpoints de produtos e imagens já implementados no backend (Hono + SQLite). O foco é criar uma experiência visual agradável para exibir todas as imagens do produto em um layout moderno.
</role>

<dependent_tasks>
- Baseie-se nas tarefas anteriores:
  - `@tasks/task_1.md` (backend de produtos)
  - `@tasks/task_2.md` (frontend - listagem)
  - `@tasks/task_3.md` (edição/remoção)
  - `@tasks/task_4.md` (upload de imagens)
</dependent_tasks>

<contexto>
- O projeto já possui infraestrutura de imagens no backend:
  - `GET /api/products/:id` retorna os dados de um produto.
  - `GET /api/products/:id/images` retorna todas as imagens ordenadas por position.
- O frontend atualmente exibe apenas a capa (primeira imagem) no grid de produtos.
- Atualmente o frontend NÃO usa roteamento; apenas renderiza `<ProductsPage />` direto no `App.tsx`.
- O TanStack Router já está no `package.json` mas ainda não foi configurado.
</contexto>

<escopo>
Esta tarefa implementa:

1. **Configuração do TanStack Router** no frontend:
   - Configurar o router com rotas tipadas (file-based routing opcional; configuração manual é mais simples).
   - Rota principal `/` para listagem de produtos.
   - Rota `/product/:id` para visualização de produto.

2. **Página de visualização de produto** (`@/pages/product-detail-page.tsx`):
   - Buscar dados do produto via `useQuery` com `GET /api/products/:id`.
   - Buscar imagens do produto via `useQuery` com `GET /api/products/:id/images`.
   - Layout moderno e agradável com:
     - **Galeria de imagens** como destaque principal (múltiplas visualizações).
     - Informações do produto (nome, descrição, preço, SKU).
     - Botões de ação (Voltar, Editar, Excluir).
   - Estados de loading, erro e produto não encontrado.

3. **Integração na listagem**:
   - Tornar os cards de produto clicáveis (navegação para `/product/:id`).
   - Usar `<Link>` do TanStack Router para navegação.

4. **Layout de galeria**:
   - Imagem principal grande.
   - Miniaturas das demais imagens abaixo/ao lado.
   - Ao clicar nas miniaturas, alterar a imagem principal.
   - Se não houver imagens, mostrar placeholder elegante.
   - Layout responsivo (mobile-first).
</escopo>

<routing_setup>
Para simplificar, use **configuração manual de rotas** (não file-based routing). Estrutura:

```ts
// @/router.tsx
import { createRouter, createRootRoute, createRoute } from '@tanstack/react-router'
import { ProductsPage } from '@/pages/products-page'
import { ProductDetailPage } from '@/pages/product-detail-page'

const rootRoute = createRootRoute({
  component: () => <Outlet />, // Renderiza a rota filha
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: ProductsPage,
})

const productDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/product/$id',
  component: ProductDetailPage,
})

const routeTree = rootRoute.addChildren([indexRoute, productDetailRoute])

export const router = createRouter({ routeTree })

// Type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

**Nota:** TanStack Router usa `$id` para parâmetros dinâmicos (não `:id`).

</routing_setup>

<frontend_requirements>
- Stack: TypeScript, Vite, React Query, TanStack Router, Zod (seguir padrão do projeto).
- Componentes UI: usar `@/components/ui/*` (shadcn) como Button, Card, Badge, Skeleton, Alert, AspectRatio, etc.
- Nomear arquivos de componentes em kebab-case (padrão do projeto): `product-detail-page.tsx`.
- Validar dados com Zod (reuso dos schemas existentes).
- Hooks:
  - `useProductById(id)` em `@/hooks/use-products.ts` — busca um produto específico.
  - `useProductImages(id)` (já existe) — busca imagens do produto.
- Caminhos relativos para API (`/api/...`, `/uploads/...`) via proxy do Vite (já configurado).
- Estados: loading (skeleton), error (alert), not found (mensagem customizada).
- Layout responsivo e acessível.
</frontend_requirements>

<backend_context>
Endpoints disponíveis (implementados em tarefas anteriores):

- `GET /api/products/:id` → retorna um produto ou 404.
- `GET /api/products/:id/images` → lista imagens ordenadas por position.

**Não é necessário alterar o backend para esta tarefa.**
</backend_context>

<layout_sugerido>
Layout moderno e visual para a página de detalhes:

```
┌────────────────────────────────────────────────────┐
│  [← Voltar]                    [Editar] [Excluir]  │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌─────────────────────┐  ┌─────────────────────┐ │
│  │                     │  │  Nome do Produto    │ │
│  │   IMAGEM GRANDE     │  │  SKU: ABC-123       │ │
│  │    (Principal)      │  │                     │ │
│  │                     │  │  Descrição...       │ │
│  │                     │  │                     │ │
│  └─────────────────────┘  │  R$ 1.999,00        │ │
│                           └─────────────────────┘ │
│  [miniatura1][miniatura2][miniatura3][miniatura4] │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Observações de layout:**
- Desktop (≥768px): imagem grande à esquerda, informações à direita, miniaturas abaixo da imagem.
- Mobile (<768px): layout em coluna (imagem grande, miniaturas, informações empilhadas).
- Imagem principal em proporção 16:9 ou 4:3 (use `@/components/ui/aspect-ratio`).
- Miniaturas clicáveis com borda destacada na ativa (ex.: `ring-2 ring-primary`).
- Botões de ação (Editar/Excluir) reusam lógica existente (modal de edição e confirmação de exclusão).
- Após exclusão, navegar de volta para `/`.
</layout_sugerido>

<typing>
Reuse tipos e schemas existentes em `@/types/product.ts`:

```ts
// Já existente no projeto
export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  createdAt: string;
}

export type ProductImage = {
  id: string;
  url: string;
  position: number;
  createdAt: string;
}
```

Hook adicional para buscar produto por ID:

```ts
// @/hooks/use-products.ts (adicionar)
export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Produto não encontrado')
        }
        throw new Error('Erro ao buscar produto')
      }
      const data = await response.json()
      return productSchema.parse(data)
    },
    enabled: !!id,
  })
}
```
</typing>

<file_structure>
Arquivos a criar/modificar em `@frontend/src/`:

```
src/
  router.tsx                   # NOVO: configuração do TanStack Router
  main.tsx                     # MODIFICAR: integrar RouterProvider
  App.tsx                      # MODIFICAR: usar Outlet do router (layout compartilhado)
  pages/
    products-page.tsx          # MODIFICAR: tornar cards clicáveis com Link
    product-detail-page.tsx    # NOVO: página de detalhes do produto
  hooks/
    use-products.ts            # MODIFICAR: adicionar useProductById
  components/
    product-card.tsx           # MODIFICAR: adicionar Link para navegação
    image-gallery.tsx          # NOVO (opcional): componente de galeria reutilizável
```
</file_structure>

<instructions>
Implemente dentro de `@frontend/` (não criar novo projeto), mantendo setup e convenções atuais:

1. **Configurar TanStack Router:**
   - Criar `@/router.tsx` com rotas `/` e `/product/$id`.
   - Modificar `@/main.tsx` para integrar `<RouterProvider router={router}>`.
   - Modificar `@/App.tsx` para usar `<Outlet />` e manter header/footer compartilhados.

2. **Criar página de detalhes (`@/pages/product-detail-page.tsx`):**
   - Usar `useParams()` do TanStack Router para extrair `id` da URL.
   - Buscar produto com `useProductById(id)`.
   - Buscar imagens com `useProductImages(id)`.
   - Renderizar layout com galeria de imagens e informações do produto.
   - Incluir botões: "Voltar" (usando `useNavigate()` ou `<Link>`), "Editar" e "Excluir".
   - Tratar estados: loading (skeleton), error (alert), not found (mensagem amigável).

3. **Criar galeria de imagens:**
   - Componente local ou separado (`@/components/image-gallery.tsx`).
   - Estado local para rastrear imagem ativa (index).
   - Imagem principal renderizada dentro de `AspectRatio` (proporção 16:9 ou 4:3).
   - Miniaturas abaixo/ao lado, clicáveis, com estilo de "ativa" (ex.: borda destacada).
   - Se não houver imagens, mostrar placeholder elegante (ex.: ícone de imagem + texto).

4. **Tornar cards clicáveis:**
   - Modificar `@/components/product-card.tsx` para envolver o card com `<Link to="/product/$id" params={{ id: product.id }}>`.
   - Adicionar cursor pointer e efeitos de hover para feedback visual.

5. **Ajustar hooks:**
   - Adicionar `useProductById(id)` em `@/hooks/use-products.ts` (ver exemplo em `<typing>`).
   - Reusar `useProductImages(id)` (já existente).

6. **Navegação após ações:**
   - Após excluir produto na página de detalhes, navegar de volta para `/` usando `useNavigate()`.

7. **Estilos e acessibilidade:**
   - Usar componentes `@/components/ui/*` (Card, Button, Badge, Skeleton, AspectRatio, Alert).
   - Design responsivo (mobile-first; usar grid/flex do Tailwind).
   - Alt text descritivo em imagens.
   - Loading states visuais (skeleton com proporções corretas).
   - Botões com estados disabled durante operações.
</instructions>

<behavior_details>
- **Loading:** exibir skeleton com layout similar à página final (imagem + informações).
- **Erro:** exibir `Alert` com mensagem de erro e botão "Voltar".
- **Não encontrado (404):** exibir mensagem amigável (ex.: "Produto não encontrado") e botão "Voltar para lista".
- **Galeria:** ao clicar em miniatura, alterar imagem principal com transição suave (opcional).
- **Navegação:** cards clicáveis no grid; breadcrumb/botão voltar na página de detalhes.
- **Ações (Editar/Excluir):** reusar componentes/lógica existentes (`EditProductDialog`, `useDeleteProduct`).
- **Após exclusão:** navegar automaticamente para `/` e mostrar toast de sucesso.
</behavior_details>

<tanstack_router_key_concepts>
O TanStack Router é um router totalmente tipado com foco em type safety e DX. Conceitos-chave:

1. **Rotas tipadas:** parâmetros e search params são inferidos automaticamente.
2. **Parâmetros dinâmicos:** usar `$id` (não `:id`) no caminho da rota.
3. **Navegação:**
   - Componente `<Link>`: `<Link to="/product/$id" params={{ id: '123' }}>Ver</Link>`
   - Hook `useNavigate()`: `const navigate = useNavigate(); navigate({ to: '/' })`
4. **Extrair parâmetros:** `const { id } = useParams({ from: '/product/$id' })`
5. **Layout compartilhado:** usar `<Outlet />` no componente raiz para renderizar rotas filhas.

**Dica:** TanStack Router v1 usa configuração imperativa (não file-based por padrão), como mostrado em `<routing_setup>`.
</tanstack_router_key_concepts>

<exemplos_navegacao>
No `ProductCard`, tornar card clicável:

```tsx
import { Link } from '@tanstack/react-router'

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="block hover:opacity-80 transition-opacity"
    >
      <Card>
        {/* ... conteúdo do card ... */}
      </Card>
    </Link>
  )
}
```

Na página de detalhes, extrair `id` e buscar dados:

```tsx
import { useParams, useNavigate } from '@tanstack/react-router'
import { useProductById, useProductImages } from '@/hooks/use-products'

export function ProductDetailPage() {
  const { id } = useParams({ from: '/product/$id' })
  const navigate = useNavigate()
  
  const { data: product, isLoading, isError } = useProductById(id)
  const { data: images } = useProductImages(id)

  // ... renderizar UI
}
```

Botão de voltar:

```tsx
import { useNavigate } from '@tanstack/react-router'

const navigate = useNavigate()

<Button variant="outline" onClick={() => navigate({ to: '/' })}>
  <ArrowLeft className="mr-2 h-4 w-4" />
  Voltar
</Button>
```
</exemplos_navegacao>

<galeria_exemplo>
Exemplo básico de galeria de imagens:

```tsx
import { useState } from 'react'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { cn } from '@/lib/utils'

interface ImageGalleryProps {
  images: { id: string; url: string; position: number }[]
  productName: string
}

export function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 rounded-lg border bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Sem imagens disponíveis</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Imagem principal */}
      <AspectRatio ratio={16 / 9}>
        <img
          src={images[activeIndex].url}
          alt={`${productName} - Imagem ${activeIndex + 1}`}
          className="w-full h-full object-cover rounded-lg border"
        />
      </AspectRatio>

      {/* Miniaturas */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-md border-2 overflow-hidden transition-all",
                activeIndex === index
                  ? "border-primary ring-2 ring-primary"
                  : "border-transparent hover:border-muted-foreground"
              )}
            >
              <img
                src={image.url}
                alt={`${productName} - Miniatura ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```
</galeria_exemplo>

<constraints>
- **NÃO DEVE** alterar o schema de `Product` ou `ProductImage`.
- **NÃO DEVE** modificar o backend para esta tarefa.
- **NÃO DEVE** usar bibliotecas de terceiros para galeria (implementar simples com componentes do projeto).
- **NÃO DEVE** fazer fetch direto na página; usar hooks com React Query.
- **NÃO DEVE** hardcodar host/porta; usar caminhos relativos (`/api/...`, `/uploads/...`).
- **DEVE** manter TypeScript, Zod, React Query, TanStack Router e padrões do projeto.
- **DEVE** seguir nomenclatura kebab-case para arquivos de componentes.
- **DEVE** usar componentes de UI existentes em `@/components/ui/*`.
- **DEVE** garantir responsividade e acessibilidade (alt text, keyboard navigation).
</constraints>

<boas_praticas>
- **Type safety:** aproveitar inferência de tipos do TanStack Router.
- **Reuso de código:** reutilizar hooks, componentes e lógica existentes (ex.: `EditProductDialog`, `useDeleteProduct`).
- **Estados de carregamento:** skeleton com layout semelhante à UI final para evitar layout shift.
- **Feedback visual:** loading states, hover effects, transições suaves.
- **Acessibilidade:** alt text descritivo, keyboard navigation, ARIA labels.
- **Responsividade:** mobile-first, testar em diferentes tamanhos de tela.
- **Separação de concerns:** extrair galeria para componente separado se ficar complexo.
- **Error boundaries:** considerar adicionar error boundary na rota (TanStack Router suporta nativamente).
- **Performance:** lazy load de imagens se necessário (atributo `loading="lazy"`).
</boas_praticas>

<nao_deve>
- Não usar `react-router-dom`; usar **TanStack Router**.
- Não implementar file-based routing (configuração manual é mais simples para este MVP).
- Não carregar todas as imagens em resolução máxima de uma vez (se houver muitas, considerar lazy loading).
- Não esquecer de invalidar cache do React Query após edição/exclusão.
- Não fazer navegação manual com `window.location` ou manipulação de histórico; usar APIs do TanStack Router.
- Não duplicar lógica de edição/exclusão; reutilizar componentes existentes.
- Não usar cores hardcoded do Tailwind; usar design tokens do tema.
- Não esquecer estados de erro e not found (UX completa).
</nao_deve>

<referencias>
- TanStack Router v1: https://tanstack.com/router/latest
- TanStack Router - Type-safe Navigation: https://tanstack.com/router/latest/docs/framework/react/guide/navigation
- TanStack Router - Route Params: https://tanstack.com/router/latest/docs/framework/react/guide/route-params
- TanStack React Query: https://tanstack.com/query/latest
- Radix UI AspectRatio: https://www.radix-ui.com/primitives/docs/components/aspect-ratio
- Shadcn/ui Components: https://ui.shadcn.com/
- Accessibility - Alt Text: https://www.w3.org/WAI/tutorials/images/
</referencias>

<acceptance_criteria>
- Em `@frontend/`, `bun run dev` inicia em `http://localhost:5173` com roteamento funcional.
- Rota `/` exibe o grid de produtos (comportamento atual preservado).
- Rota `/product/:id` exibe página de detalhes com:
  - Galeria de imagens (principal + miniaturas clicáveis).
  - Informações do produto (nome, descrição, preço, SKU).
  - Botões: Voltar, Editar, Excluir (funcionais).
- Cards na listagem são clicáveis e navegam para `/product/:id`.
- Estados de loading, error e not found implementados e visuais.
- Layout responsivo (desktop e mobile).
- Após exclusão, navega de volta para `/` automaticamente.
- TypeScript sem erros, lint passando, build funcionando.
- Navegação tipada (sem erros de tipo ao usar `Link` e `useNavigate`).
</acceptance_criteria>

<passos_sugeridos>
1. **Configurar TanStack Router:**
   - Criar `@/router.tsx` com rotas `/` e `/product/$id`.
   - Modificar `@/main.tsx` para integrar `RouterProvider`.
   - Ajustar `@/App.tsx` para usar `<Outlet />` e manter layout compartilhado.

2. **Criar hook `useProductById`:**
   - Adicionar em `@/hooks/use-products.ts`.
   - Usar `useQuery` com `queryKey: ['product', id]`.
   - Validar resposta com Zod.

3. **Criar página de detalhes:**
   - Criar `@/pages/product-detail-page.tsx`.
   - Extrair `id` com `useParams()`.
   - Buscar produto e imagens com hooks.
   - Renderizar layout com galeria e informações.
   - Adicionar botões de ação.

4. **Criar componente de galeria:**
   - Pode ser local em `product-detail-page.tsx` ou separado em `@/components/image-gallery.tsx`.
   - Estado local para controlar imagem ativa.
   - Renderizar imagem principal + miniaturas.

5. **Tornar cards clicáveis:**
   - Modificar `@/components/product-card.tsx`.
   - Envolver com `<Link to="/product/$id" params={{ id: product.id }}>`.
   - Ajustar estilos para feedback visual.

6. **Testar fluxos:**
   - Navegar do grid para detalhes.
   - Clicar em miniaturas e verificar mudança de imagem.
   - Editar produto e verificar atualização.
   - Excluir produto e verificar navegação de volta para `/`.
   - Testar estados de erro e not found.

7. **Polir UI:**
   - Ajustar responsividade.
   - Adicionar transições suaves.
   - Verificar acessibilidade (alt text, keyboard navigation).
   - Garantir consistency visual com o restante da aplicação.
</passos_sugeridos>

<output>
Além do código, forneça:

1. **Resumo de implementação:**
   - O que foi adicionado/modificado.
   - Decisões de design e layout da galeria.
   - Como o TanStack Router foi configurado.

2. **Exemplos de navegação:**
   - Como acessar a página de detalhes (URL).
   - Como as ações (Editar/Excluir) se comportam na página de detalhes.

3. **Screenshots ou descrição visual:**
   - Descrever como ficou o layout da galeria (ou incluir screenshot se possível).
   - Layout desktop vs mobile.

4. **Decisões técnicas:**
   - Por que escolheu configuração manual vs file-based routing.
   - Como a galeria foi estruturada (componente separado ou inline).
   - Quais componentes shadcn/ui foram utilizados.
</output>

