import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Critical sales flow (spec §40): create product -> add stock -> create order ->
 * complete order -> generate stock movement -> validate balance.
 * Requires PostgreSQL + a seeded admin user.
 */
describe('Orders & Inventory (e2e)', () => {
  let app: INestApplication;
  let token: string;
  const sku = `E2E-${Date.now()}`;

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@lubdiesel.com.br';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: [{ path: 'health', method: RequestMethod.GET }] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: adminEmail, password: adminPassword })
      .expect(200);
    token = login.body.data.accessToken;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('sells stock and decreases the balance on completion', async () => {
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

    const product = await auth(
      request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ sku, name: 'E2E Product', volumeMl: 100, costPrice: 5, salePrice: 12 }),
    ).expect(201);
    const productId = product.body.data.id;

    await auth(
      request(app.getHttpServer())
        .post('/api/v1/inventory/movements')
        .send({ productId, type: 'PURCHASE', quantity: 100 }),
    ).expect(201);

    const order = await auth(
      request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({ source: 'DIRECT', items: [{ productId, quantity: 2 }] }),
    ).expect(201);
    expect(Number(order.body.data.total)).toBe(24);

    await auth(
      request(app.getHttpServer())
        .patch(`/api/v1/orders/${order.body.data.id}/status`)
        .send({ status: 'COMPLETED' }),
    ).expect(200);

    const balance = await auth(
      request(app.getHttpServer()).get(`/api/v1/inventory/products/${productId}/balance`),
    ).expect(200);
    expect(balance.body.data.balance).toBe(98);
  });

  it('rejects completing an order with insufficient stock', async () => {
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

    const product = await auth(
      request(app.getHttpServer())
        .post('/api/v1/products')
        .send({
          sku: `${sku}-B`,
          name: 'E2E Product B',
          volumeMl: 100,
          costPrice: 5,
          salePrice: 12,
        }),
    ).expect(201);
    const productId = product.body.data.id;

    const order = await auth(
      request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({ source: 'DIRECT', items: [{ productId, quantity: 3 }] }),
    ).expect(201);

    await auth(
      request(app.getHttpServer())
        .patch(`/api/v1/orders/${order.body.data.id}/status`)
        .send({ status: 'COMPLETED' }),
    ).expect(400);
  });
});
