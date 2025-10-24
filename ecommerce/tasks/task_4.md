<role>
Você é um engenheiro de software sênior. Vai implementar um MVP de upload de imagens de **produtos** no monorepo existente, cobrindo backend (Hono + SQLite + Bun) e frontend (React/Vite), seguindo o padrão simples das tasks anteriores e SEM alterar o schema de `Product`.
</role>

<dependent_tasks>
- Baseie-se nas tasks anteriores: `@tasks/task_1.md` (backend), `@tasks/task_2.md` (frontend) e `@tasks/task_3.md` (edição/remoção).
</dependent_tasks>

<contexto>
- Já existe a tabela `product_images` no backend e scripts de seed que copiam imagens para `backend/uploads/products`.
- Precisamos expor `/uploads/...` estaticamente e criar endpoints de imagens por produto.
- No frontend, mostrar apenas a "capa" (primeira imagem por `position`) no `ProductCard`. Upload simples, múltiplos arquivos, nos diálogos de criar/editar.
</contexto>

<escopo>
MVP, mantendo o projeto minimalista:

- Armazenamento local em `backend/uploads/products` e servir estaticamente via `/uploads/...`.
- `POST /api/products/:id/images` aceita apenas `multipart/form-data` com campo `images` (pode enviar múltiplos arquivos). Não suportar "adicionar por URL" neste MVP.
- Ao deletar imagem/produto, remover também o arquivo local do disco (quando a URL for local).
- Frontend: exibir apenas a capa (primeira imagem) no card; upload múltiplo simples nos diálogos de criar/editar. Sem galeria, sem reordenação.
- Em dev, proxiar também `'/uploads'` no `@frontend/vite.config.ts`.
- Limites default: até 5 arquivos por request; até 5MB por arquivo; validar mimetype (`image/jpeg`, `image/png`, `image/webp`).
</escopo>

<backend_requirements>
- Linguagem/stack: TypeScript, Hono 4+, Bun, Zod (mesmo padrão do projeto).
- Servir estáticos:
  - Expor `backend/uploads` via `/uploads` (ex.: `GET /uploads/products/abc.jpg`).
  - Garantir criação de diretórios com `fs.mkdirSync(uploadsDir, { recursive: true })`.
- Endpoints de imagens (por produto):
  - `GET /api/products/:id/images` → lista imagens do produto (ordenar por `position ASC, createdAt ASC`).
  - `POST /api/products/:id/images` → upload de múltiplos arquivos no campo `images` (multipart). Para cada arquivo válido:
    - Validar tamanho e mimetype.
    - Gerar nome único (UUID + extensão normalizada) e salvar em `backend/uploads/products`.
    - Persistir em `product_images` com `url` relativa iniciando com `/uploads/products/...` e `position` incremental (append ao final).
    - Retornar 201 com payload simples das imagens criadas.
  - `DELETE /api/products/:id/images/:imageId` → deletar row e, se a URL for local (`/uploads/products/...`), remover arquivo do disco.
- Erros e validação (seguir padrão do projeto):
  - `400` validação (ID inválido, sem arquivos, arquivo vazio, etc.).
  - `404` produto/Imagem inexistente.
  - `413` arquivo muito grande (> 5MB).
  - `415` mimetype não suportado.
  - `500` genérico.
- Observações:
  - NÃO alterar o schema base de `Product` e nem a resposta de `/api/products`.
  - Usar URLs relativas (começando com `/uploads/...`).
  - Sanitizar extensão a partir do mimetype detectado; não confiar no nome original.
</backend_requirements>

<frontend_requirements>
- Stack: TypeScript, Vite, React Query, react-hook-form, Zod e componentes `@/components/ui/*`.
- Proxy do Vite: além de `'/api'`, adicionar proxy para `'/uploads'` apontando para o backend.
- Tipos:
  - Manter `Product` inalterado.
  - Criar schema/typing local para imagem (ex.: `{ id: string; url: string; position: number; createdAt: string }`).
- Hooks:
  - `useUploadProductImages(productId)` com `useMutation` para `POST /api/products/:id/images` usando `FormData` com múltiplos arquivos.
  - (Opcional e simples) `useProductImages(productId)` com `useQuery` para `GET /api/products/:id/images`, se for necessário buscar capa depois.
- UI:
  - `ProductCard`: renderizar apenas a capa (primeira imagem). Se não houver, mostrar placeholder.
  - `AddProductDialog`/`EditProductDialog`: campo de upload múltiplo (pode usar `@/components/ui/kibo-ui/dropzone` ou `<input type="file" multiple>`). Após criar/editar, se houver arquivos selecionados, chamar `useUploadProductImages` e invalidar `['products']` (e/ou cache de imagens) ao final.
  - Sem galeria e sem reordenação neste MVP.
- Requisições sempre com caminhos relativos (`/api/...` e `/uploads/...`) via proxy.
</frontend_requirements>

<exemplos_de_requests>
- Upload multipart (múltiplos arquivos):

```bash
curl -X POST http://localhost:3005/api/products/<PRODUCT_ID>/images \
  -F "images=@/caminho/imagem1.jpg" \
  -F "images=@/caminho/imagem2.png"
```

- Listar imagens do produto:

```bash
curl http://localhost:3005/api/products/<PRODUCT_ID>/images
```

- Deletar imagem específica:

```bash
curl -X DELETE http://localhost:3005/api/products/<PRODUCT_ID>/images/<IMAGE_ID>
```
</exemplos_de_requests>

<aceptance_criteria>
- Backend:
  - Servir `/uploads/...` funcionando localmente.
  - `POST /api/products/:id/images` salva arquivos válidos no disco, cria rows e retorna 201.
  - `GET /api/products/:id/images` retorna lista ordenada.
  - `DELETE /api/products/:id/images/:imageId` remove row e arquivo local.
  - Limites e validações ativas (tamanho, mimetype, quantidade).
- Frontend:
  - `ProductCard` exibe capa quando existir; placeholder caso contrário.
  - Diálogos de criar/editar suportam selecionar múltiplas imagens e fazer upload após salvar o produto.
  - Proxy de `'/uploads'` configurado; `<img src="/uploads/...">` funciona em dev.
  - Estados de loading/erro simples nas mutações.
</aceptance_criteria>

<passos_sugeridos>
1) Backend
   - Adicionar middleware estático para `/uploads` e garantir existência de `backend/uploads/products`.
   - Implementar endpoints de imagens no router de produtos (`GET/POST/DELETE`).
   - Validar limites (até 5 arquivos, 5MB cada, mimetypes permitidos). Gerar nomes com UUID e gravar no disco.
   - Ao excluir imagem/produto, remover arquivo local quando aplicável.

2) Frontend
   - Adicionar proxy para `'/uploads'` no `vite.config.ts`.
   - Ajustar `ProductCard` para buscar/exibir a capa simples (primeira imagem) — ou derivar da resposta se já estiver no cache.
   - Atualizar diálogos para permitir selecionar arquivos; após salvar/editar, enviar via `useUploadProductImages`.
   - Invalidar `['products']` (e/ou cache de imagens) após sucesso.

3) Smoke test manual
   - Criar produto → fazer upload de 1–2 imagens → ver capa no grid → deletar uma imagem → confirmar remoção visual e no disco.

4) (Opcional) Testes básicos de integração
   - `POST` com arquivo válido e inválido (mimetype/tamanho); `GET` lista; `DELETE` remove row e arquivo.

</passos_sugeridos>

<boas_praticas>
- **URLs relativas** para arquivos (`/uploads/...`), nunca caminhos absolutos do filesystem.
- **Validar mimetype real** (não confiar só na extensão). Rejeitar tipos não suportados.
- **Gerar nome único** com UUID e manter extensão coerente com o mimetype.
- **Sanitizar** nomes/paths e bloquear path traversal.
- **Respostas JSON consistentes** e códigos HTTP corretos.
- **Evitar dependências** novas neste MVP (sem thumbnails/transformações).
- **Invalidar caches** do React Query após mutações.
</boas_praticas>

<nao_deve>
- Não alterar o schema de `Product` nem mudar o contrato de `/api/products`.
- Não aceitar "adicionar por URL" neste MVP.
- Não hardcodar host/porta no frontend; usar caminhos relativos e proxy do Vite.
- Não confiar somente na extensão do arquivo; validar mimetype.
- Não salvar caminhos absolutos do disco no banco; salvar URLs relativas.
- Não permitir uploads ilimitados (aplicar limites de tamanho e quantidade).
- Não incorporar imagens em Base64 no JSON das APIs.
</nao_deve>

<referencias>
- Hono – Uploads/multipart e FormData: [Documentação Hono](https://hono.dev/)
- Hono – Servir estáticos (`serveStatic` – Bun): [Exemplos Hono Bun](https://hono.dev/getting-started/bun)
- Bun FS (arquivos): [Bun.serve e FS](https://bun.sh/docs/api/fs)
- Vite Proxy: [Configuração de Proxy no Vite](https://vitejs.dev/config/server-options.html#server-proxy)
- MDN – `multipart/form-data`: [FormData MDN](https://developer.mozilla.org/docs/Web/API/FormData)
</referencias>

<output>
Além do código, forneça um breve resumo do que foi implementado, exemplos de requests de upload e anote decisões/limites aplicados (quantidade, tamanho, mimetypes) no README do backend.
</output>


