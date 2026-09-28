import { INestApplication, RequestMethod, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Critical CRM flow (spec §40): contact -> lead -> stage change -> follow-up -> win/convert.
 * Requires a running PostgreSQL instance and a seeded admin user.
 */
describe('CRM flow (e2e)', () => {
  let app: INestApplication;
  let token: string;

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

  it('runs the full lead lifecycle and converts the contact', async () => {
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

    const contactRes = await auth(
      request(app.getHttpServer())
        .post('/api/v1/contacts')
        .send({ firstName: 'E2E', lastName: 'Prospect', source: 'WHATSAPP' }),
    ).expect(201);
    const contactId = contactRes.body.data.id;
    expect(contactRes.body.data.type).toBe('LEAD');

    const leadRes = await auth(
      request(app.getHttpServer())
        .post('/api/v1/leads')
        .send({ contactId, source: 'WHATSAPP', estimatedValue: 1200 }),
    ).expect(201);
    const leadId = leadRes.body.data.id;
    expect(leadRes.body.data.status).toBe('NEW');

    await auth(
      request(app.getHttpServer())
        .patch(`/api/v1/leads/${leadId}/stage`)
        .send({ status: 'NEGOTIATION', note: 'Sent proposal' }),
    ).expect(200);

    await auth(
      request(app.getHttpServer())
        .post('/api/v1/follow-ups')
        .send({ type: 'WHATSAPP', scheduledAt: '2026-10-05T14:00:00.000Z', leadId }),
    ).expect(201);

    const wonRes = await auth(
      request(app.getHttpServer()).patch(`/api/v1/leads/${leadId}/stage`).send({ status: 'WON' }),
    ).expect(200);
    expect(wonRes.body.data.convertedAt).toBeTruthy();

    const contactAfter = await auth(
      request(app.getHttpServer()).get(`/api/v1/contacts/${contactId}`),
    ).expect(200);
    expect(contactAfter.body.data.type).toBe('CUSTOMER');

    const board = await auth(request(app.getHttpServer()).get('/api/v1/pipeline')).expect(200);
    expect(Array.isArray(board.body.columns)).toBe(true);
  });

  it('rejects marking a lead as LOST without a reason', async () => {
    const auth = (req: request.Test) => req.set('Authorization', `Bearer ${token}`);

    const contactRes = await auth(
      request(app.getHttpServer()).post('/api/v1/contacts').send({ firstName: 'Lost' }),
    ).expect(201);
    const leadRes = await auth(
      request(app.getHttpServer())
        .post('/api/v1/leads')
        .send({ contactId: contactRes.body.data.id, source: 'REFERRAL' }),
    ).expect(201);

    await auth(
      request(app.getHttpServer())
        .patch(`/api/v1/leads/${leadRes.body.data.id}/stage`)
        .send({ status: 'LOST' }),
    ).expect(400);
  });
});
