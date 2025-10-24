import { z } from 'zod';

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  sku: z.string(),
  createdAt: z.string(),
});

export const productsSchema = z.array(productSchema);

// Image type (local to frontend)
export const productImageSchema = z.object({
  id: z.string(),
  url: z.string(),
  position: z.number(),
  createdAt: z.string(),
});
export const productImagesSchema = z.array(productImageSchema);

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  price: z.number().positive('Preço deve ser positivo'),
  sku: z.string().min(1, 'SKU é obrigatório'),
});

export const updateProductSchema = createProductSchema;

export type Product = z.infer<typeof productSchema>;
export type CreateProduct = z.infer<typeof createProductSchema>;
export type UpdateProduct = z.infer<typeof updateProductSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
