import * as dotenv from 'dotenv';

dotenv.config();

import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';

import { whatsappRoutes } from './routes/whatsapp';
import { invoiceRoutes } from './routes/invoice';
import prisma from './plugins/prisma';

const app = Fastify({
  logger: true,
});

app.register(fastifyCors, {
  origin: true,
  methods: [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
  ],
});

app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET as string,
});

// Prisma plugin
app.register(prisma);

// Routes
app.register(whatsappRoutes, { prefix: '/api/whatsapp' });
app.register(invoiceRoutes, { prefix: '/api/invoices' });

app.get('/', async () => {
  return {
    message: 'Phoneo is running 🚀',
  };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 4000;

    await app.listen({
      port,
      host: '0.0.0.0',
    });

    console.log(
      `Phoneo Server running on port ${port} 🚀`
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();