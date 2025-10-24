import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productSchema,
  type CreateProduct,
  type Product,
} from '@/types/product';

async function createProduct(data: CreateProduct): Promise<Product> {
  const response = await fetch('/api/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Falha ao criar produto');
  }

  const result = await response.json();
  return productSchema.parse(result);
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
