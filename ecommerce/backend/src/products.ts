import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getStatements } from './db';
import fs from 'fs';
import path from 'path';

// Zod schema for product validation
const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.number().positive('Price must be positive'),
  sku: z.string().min(1, 'SKU is required'),
});

const UpdateProductSchema = CreateProductSchema;

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  sku: string;
  createdAt: string;
};

const products = new Hono();

// POST /api/products - Create a new product
products.post('/', async (c) => {
  try {
    const body = await c.req.json();

    // Validate input
    const validation = CreateProductSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        400
      );
    }

    const data = validation.data;
    const statements = getStatements();

    // Check if SKU already exists
    const existingProduct = statements.getProductBySku.get({ $sku: data.sku });
    if (existingProduct) {
      return c.json(
        {
          error: 'SKU already exists',
          message: `A product with SKU "${data.sku}" already exists`,
        },
        400
      );
    }

    // Create product
    const productId = randomUUID();
    const createdAt = new Date().toISOString();

    statements.insertProduct.run({
      $id: productId,
      $name: data.name,
      $description: data.description,
      $price: data.price,
      $sku: data.sku,
      $createdAt: createdAt,
    });

    const product: Product = {
      id: productId,
      name: data.name,
      description: data.description,
      price: data.price,
      sku: data.sku,
      createdAt,
    };

    return c.json(product, 201);
  } catch (error) {
    console.error('Error creating product:', error);
    return c.json(
      {
        error: 'Failed to create product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// GET /api/products - List all products
products.get('/', async (c) => {
  try {
    const statements = getStatements();
    const allProducts = statements.getAllProducts.all() as Product[];

    return c.json(allProducts);
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// GET /api/products/:id - Get a single product by ID (bonus)
products.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const statements = getStatements();

    const product = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;

    if (!product) {
      return c.json(
        {
          error: 'Product not found',
          message: `No product found with id "${id}"`,
        },
        404
      );
    }

    return c.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json(
      {
        error: 'Failed to fetch product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// PUT /api/products/:id - Update an existing product
products.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const validation = UpdateProductSchema.safeParse(body);
    if (!validation.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: validation.error.issues,
        },
        400
      );
    }

    const data = validation.data;
    const statements = getStatements();

    const existingProduct = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;
    if (!existingProduct) {
      return c.json(
        {
          error: 'Product not found',
          message: `No product found with id "${id}"`,
        },
        404
      );
    }

    if (existingProduct.sku !== data.sku) {
      const productWithSameSku = statements.getProductBySku.get({
        $sku: data.sku,
      }) as Product | undefined;
      if (productWithSameSku && productWithSameSku.id !== id) {
        return c.json(
          {
            error: 'SKU already exists',
            message: `A product with SKU "${data.sku}" already exists`,
          },
          400
        );
      }
    }

    const result = statements.updateProduct.run({
      $id: id,
      $name: data.name,
      $description: data.description,
      $price: data.price,
      $sku: data.sku,
    });

    if ('changes' in result && result.changes === 0) {
      return c.json(
        {
          error: 'Product not updated',
          message: `Failed to update product with id "${id}"`,
        },
        500
      );
    }

    const updatedProduct = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;

    if (!updatedProduct) {
      return c.json(
        {
          error: 'Product not found after update',
          message: `Product with id "${id}" was not found after update`,
        },
        500
      );
    }

    return c.json(updatedProduct, 200);
  } catch (error) {
    console.error('Error updating product:', error);
    return c.json(
      {
        error: 'Failed to update product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// DELETE /api/products/:id - Delete a product
products.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const statements = getStatements();

    const existingProduct = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;
    if (!existingProduct) {
      return c.json(
        {
          error: 'Product not found',
          message: `No product found with id "${id}"`,
        },
        404
      );
    }

    const result = statements.deleteProduct.run({ $id: id });

    if ('changes' in result && result.changes === 0) {
      return c.json(
        {
          error: 'Product not deleted',
          message: `Failed to delete product with id "${id}"`,
        },
        500
      );
    }

    return c.body(null, 204);
  } catch (error) {
    console.error('Error deleting product:', error);
    return c.json(
      {
        error: 'Failed to delete product',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

export default products;

// --- Images Endpoints ---

// GET /api/products/:id/images - List images for a product
products.get('/:id/images', async (c) => {
  try {
    const id = c.req.param('id');
    const statements = getStatements();

    const product = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;
    if (!product) {
      return c.json(
        {
          error: 'Product not found',
          message: `No product found with id "${id}"`,
        },
        404
      );
    }

    const images = statements.getImagesByProductId.all({ $productId: id });
    return c.json(images);
  } catch (error) {
    console.error('Error listing product images:', error);
    return c.json(
      {
        error: 'Failed to list product images',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// POST /api/products/:id/images - Upload multiple images (multipart/form-data, field: images)
products.post('/:id/images', async (c) => {
  try {
    const id = c.req.param('id');
    const statements = getStatements();

    const product = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;
    if (!product) {
      return c.json(
        {
          error: 'Product not found',
          message: `No product found with id "${id}"`,
        },
        404
      );
    }

    const form = await c.req.formData();
    const entries = form.getAll('images');

    if (!entries || entries.length === 0) {
      return c.json(
        {
          error: 'Validation failed',
          message:
            'No files provided. Use field "images" with one or more files.',
        },
        400
      );
    }

    const MAX_FILES = 5;
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const allowedTypes: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    };

    if (entries.length > MAX_FILES) {
      return c.json(
        {
          error: 'Too many files',
          message: `You can upload up to ${MAX_FILES} files per request`,
        },
        400
      );
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const existingImages = statements.getImagesByProductId.all({
      $productId: id,
    }) as any[];
    let basePosition = existingImages.length;
    const createdAt = new Date().toISOString();

    const createdImages: any[] = [];

    for (const entry of entries) {
      if (!(entry instanceof File)) {
        return c.json(
          {
            error: 'Validation failed',
            message: 'Invalid form entry for images',
          },
          400
        );
      }

      const contentType = entry.type;
      const size = entry.size;

      if (!allowedTypes[contentType]) {
        return c.json(
          {
            error: 'Unsupported Media Type',
            message: `Only JPEG, PNG and WEBP are supported`,
          },
          415
        );
      }

      if (size > MAX_SIZE) {
        return c.json(
          {
            error: 'Payload Too Large',
            message: `File size must be <= ${MAX_SIZE} bytes`,
          },
          413
        );
      }

      const ext = allowedTypes[contentType];
      const filename = `${crypto.randomUUID()}${ext}`;
      const filepath = path.join(uploadsDir, filename);

      const arrayBuffer = await entry.arrayBuffer();
      await Bun.write(filepath, new Uint8Array(arrayBuffer));

      const url = `/uploads/products/${filename}`;
      const imageId = crypto.randomUUID();
      const position = basePosition++;

      statements.insertProductImage.run({
        $id: imageId,
        $productId: id,
        $url: url,
        $position: position,
        $createdAt: createdAt,
      });

      createdImages.push({
        id: imageId,
        productId: id,
        url,
        position,
        createdAt,
      });
    }

    return c.json(createdImages, 201);
  } catch (error) {
    console.error('Error uploading product images:', error);
    return c.json(
      {
        error: 'Failed to upload product images',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});

// DELETE /api/products/:id/images/:imageId - Remove image and delete local file when applicable
products.delete('/:id/images/:imageId', async (c) => {
  try {
    const id = c.req.param('id');
    const imageId = c.req.param('imageId');
    const statements = getStatements();

    const product = statements.getProductById.get({ $id: id }) as
      | Product
      | undefined;
    if (!product) {
      return c.json(
        {
          error: 'Product not found',
          message: `No product found with id "${id}"`,
        },
        404
      );
    }

    const image = statements.getImageById.get({ $id: imageId }) as
      | { id: string; productId: string; url: string }
      | undefined;

    if (!image || image.productId !== id) {
      return c.json(
        {
          error: 'Image not found',
          message: `No image found with id "${imageId}" for product "${id}"`,
        },
        404
      );
    }

    // If local file URL, delete from disk
    if (image.url.startsWith('/uploads/products/')) {
      const filepath = path.join(process.cwd(), image.url);
      if (fs.existsSync(filepath)) {
        try {
          fs.unlinkSync(filepath);
        } catch (err) {
          console.warn('Failed to remove file from disk:', err);
        }
      }
    }

    statements.deleteImageById.run({ $id: imageId });
    return c.body(null, 204);
  } catch (error) {
    console.error('Error deleting product image:', error);
    return c.json(
      {
        error: 'Failed to delete product image',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      500
    );
  }
});
