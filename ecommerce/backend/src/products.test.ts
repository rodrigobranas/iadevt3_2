import { describe, test, expect, beforeEach, afterAll } from 'bun:test';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import products from './products';
import { db, initDatabase } from './db';

// Create a test app instance
const createTestApp = () => {
  const app = new Hono();

  app.use(
    '/*',
    cors({
      origin: ['http://localhost:5173'],
      credentials: true,
    })
  );

  app.route('/api/products', products);

  return app;
};

describe('Products API Integration Tests', () => {
  let app: Hono;

  beforeEach(() => {
    // Initialize database and clean products table before each test
    initDatabase();
    db.exec('DELETE FROM products');
    app = createTestApp();
  });

  afterAll(() => {
    // Clean up database after all tests
    db.exec('DELETE FROM products');
    db.close();
  });

  describe('POST /api/products', () => {
    test('should create a new product successfully', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        sku: 'TEST-SKU-001',
      };

      const req = new Request('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(201);

      const json = (await res.json()) as any;
      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('createdAt');
      expect(json.name).toBe(productData.name);
      expect(json.description).toBe(productData.description);
      expect(json.price).toBe(productData.price);
      expect(json.sku).toBe(productData.sku);
    });

    test('should return 400 when name is empty', async () => {
      const productData = {
        name: '',
        description: 'Test Description',
        price: 99.99,
        sku: 'TEST-SKU-002',
      };

      const req = new Request('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(400);

      const json = (await res.json()) as any;
      expect(json.error).toBe('Validation failed');
      expect(json.details).toBeArray();
      expect(json.details[0].path).toEqual(['name']);
      expect(json.details[0].message).toBe('Name is required');
    });

    test('should return 400 when description is missing', async () => {
      const productData = {
        name: 'Test Product',
        price: 99.99,
        sku: 'TEST-SKU-003',
      };

      const req = new Request('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(400);

      const json = (await res.json()) as any;
      expect(json.error).toBe('Validation failed');
    });

    test('should return 400 when price is negative', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: -10,
        sku: 'TEST-SKU-004',
      };

      const req = new Request('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(400);

      const json = (await res.json()) as any;
      expect(json.error).toBe('Validation failed');
      expect(json.details[0].path).toEqual(['price']);
      expect(json.details[0].message).toBe('Price must be positive');
    });

    test('should return 400 when price is zero', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 0,
        sku: 'TEST-SKU-005',
      };

      const req = new Request('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(400);

      const json = (await res.json()) as any;
      expect(json.error).toBe('Validation failed');
    });

    test('should return 400 when SKU is empty', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        sku: '',
      };

      const req = new Request('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(400);

      const json = (await res.json()) as any;
      expect(json.error).toBe('Validation failed');
      expect(json.details[0].path).toEqual(['sku']);
      expect(json.details[0].message).toBe('SKU is required');
    });

    test('should return 400 when SKU already exists', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        sku: 'DUPLICATE-SKU',
      };

      // Create first product
      const req1 = new Request('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      await app.fetch(req1);

      // Try to create product with same SKU
      const req2 = new Request('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...productData,
          name: 'Another Product',
        }),
      });

      const res = await app.fetch(req2);
      expect(res.status).toBe(400);

      const json = (await res.json()) as any;
      expect(json.error).toBe('SKU already exists');
      expect(json.message).toContain('DUPLICATE-SKU');
    });
  });

  describe('GET /api/products', () => {
    test('should return empty array when no products exist', async () => {
      const req = new Request('http://localhost/api/products', {
        method: 'GET',
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(json).toBeArray();
      expect(json).toHaveLength(0);
    });

    test('should return all products', async () => {
      // Create two products
      const products = [
        {
          name: 'Product 1',
          description: 'Description 1',
          price: 100,
          sku: 'SKU-001',
        },
        {
          name: 'Product 2',
          description: 'Description 2',
          price: 200,
          sku: 'SKU-002',
        },
      ];

      for (const product of products) {
        const req = new Request('http://localhost/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(product),
        });
        await app.fetch(req);
      }

      // Get all products
      const req = new Request('http://localhost/api/products', {
        method: 'GET',
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(json).toBeArray();
      expect(json).toHaveLength(2);

      // Verify both products are present (order may vary with identical timestamps)
      const names = json.map((p: any) => p.name);
      expect(names).toContain('Product 1');
      expect(names).toContain('Product 2');
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return product by id', async () => {
      // Create a product first
      const productData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        sku: 'TEST-SKU-GET',
      };

      const createReq = new Request('http://localhost/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const createRes = await app.fetch(createReq);
      const createdProduct = (await createRes.json()) as any;

      // Get product by ID
      const req = new Request(`http://localhost/api/products/${createdProduct.id}`, {
        method: 'GET',
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(200);

      const json = (await res.json()) as any;
      expect(json.id).toBe(createdProduct.id);
      expect(json.name).toBe(productData.name);
      expect(json.description).toBe(productData.description);
      expect(json.price).toBe(productData.price);
      expect(json.sku).toBe(productData.sku);
    });

    test('should return 404 when product not found', async () => {
      const req = new Request('http://localhost/api/products/non-existent-id', {
        method: 'GET',
      });

      const res = await app.fetch(req);
      expect(res.status).toBe(404);

      const json = (await res.json()) as any;
      expect(json.error).toBe('Product not found');
      expect(json.message).toContain('non-existent-id');
    });
  });

  describe('CORS', () => {
    test('should include CORS headers', async () => {
      const req = new Request('http://localhost/api/products', {
        method: 'GET',
        headers: {
          Origin: 'http://localhost:5173',
        },
      });

      const res = await app.fetch(req);
      expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
    });
  });
});
