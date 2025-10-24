import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import {
  productSchema,
  productsSchema,
  type Product,
  type UpdateProduct,
  updateProductSchema,
  productImagesSchema,
  type ProductImage,
} from '@/types/product';

async function fetchProducts(): Promise<Product[]> {
  const response = await fetch('/api/products');

  if (!response.ok) {
    throw new Error('Falha ao buscar produtos');
  }

  const data = await response.json();
  return productsSchema.parse(data);
}

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 30_000,
    retry: 1,
  });
}

// Fetch single product by ID
async function fetchProductById(id: string): Promise<Product> {
  const response = await fetch(`/api/products/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Produto não encontrado');
    }
    throw new Error('Falha ao buscar produto');
  }

  const data = await response.json();
  return productSchema.parse(data);
}

export function useProductById(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id),
    enabled: !!id,
    staleTime: 30_000,
    retry: 1,
  });
}

// Fetch product images (optional helper)
async function fetchProductImages(productId: string): Promise<ProductImage[]> {
  const response = await fetch(`/api/products/${productId}/images`);
  if (!response.ok) {
    throw new Error('Falha ao buscar imagens do produto');
  }
  const data = await response.json();
  return productImagesSchema.parse(data);
}

export function useProductImages(productId: string, enabled = true) {
  return useQuery({
    queryKey: ['product-images', productId],
    queryFn: () => fetchProductImages(productId),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}

const updateProductVariablesSchema = z.object({
  id: z.string(),
  data: updateProductSchema,
});

type UpdateProductVariables = z.infer<typeof updateProductVariablesSchema>;

async function updateProductRequest({
  id,
  data,
}: UpdateProductVariables): Promise<Product> {
  const parsed = updateProductVariablesSchema.parse({ id, data });
  const payload: UpdateProduct = updateProductSchema.parse(parsed.data);

  const response = await fetch(`/api/products/${parsed.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Falha ao atualizar produto');
  }

  const result = await response.json();
  return productSchema.parse(result);
}

const deleteProductVariablesSchema = z.object({
  id: z.string(),
});

type DeleteProductVariables = z.infer<typeof deleteProductVariablesSchema>;

async function deleteProductRequest({ id }: DeleteProductVariables) {
  const { id: parsedId } = deleteProductVariablesSchema.parse({ id });
  const response = await fetch(`/api/products/${parsedId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Falha ao excluir produto');
  }
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProductRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProductRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// Upload images
const uploadImagesVariablesSchema = z.object({
  productId: z.string(),
  files: z.instanceof(File).array().min(1),
});

type UploadImagesVariables = z.infer<typeof uploadImagesVariablesSchema>;

async function uploadProductImages({
  productId,
  files,
}: UploadImagesVariables) {
  const { productId: id, files: fileList } = uploadImagesVariablesSchema.parse({
    productId,
    files,
  });
  const formData = new FormData();
  for (const file of fileList) {
    formData.append('images', file);
  }
  const response = await fetch(`/api/products/${id}/images`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new Error(error?.message || 'Falha ao enviar imagens');
  }
}

export function useUploadProductImages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadProductImages,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({
        queryKey: ['product-images', variables.productId],
      });
    },
  });
}
