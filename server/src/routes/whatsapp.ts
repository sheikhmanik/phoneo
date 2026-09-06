import { FastifyInstance } from 'fastify';

import {
  createSession,
  getSession,
  addClient,
  removeClient,
  removeSession,
} from '../services/whatsapp';

export async function whatsappRoutes(fastify: FastifyInstance) {

  // POST /api/whatsapp/session
  fastify.post('/session', async (_request, reply) => {
    const session = await createSession(fastify.prisma);

    fastify.log.info(
      `Created WhatsApp session: ${session.id}`
    );

    return reply.code(201).send({
      sessionId: session.id,
    });
  });

  // POST /api/whatsapp/session/:sessionId/logout
  fastify.post<{Params: { sessionId: string }}>('/session/:sessionId/logout', async (request, reply) => {
    const { sessionId } = request.params;

    const session = getSession(sessionId);

    if (!session) {
      return reply.code(404).send({
        message: 'WhatsApp session not found.',
      });
    }

    await removeSession(sessionId);

    return reply.send({
      success: true,
      message: 'WhatsApp disconnected successfully.',
    });
  });

  // GET /api/whatsapp/session/:sessionId
  fastify.get<{Params: { sessionId: string }}>('/session/:sessionId', async (request, reply) => {
      
    const { sessionId } = request.params;

    const session = getSession(sessionId);

    if (!session) {
      return reply.code(404).send({
        message: 'WhatsApp session not found.',
      });
    }

    return reply.send({
      sessionId: session.id,
      status: session.status,
      phoneNumber: session.phoneNumber ?? null,
    });
  });

  // GET /api/whatsapp/session/:sessionId/events
  fastify.get<{ Params: { sessionId: string } }>(
    '/session/:sessionId/events',
    async (request, reply) => {
      const { sessionId } = request.params;

      const session = getSession(sessionId);

      if (!session) {
        return reply.code(404).send({
          message: 'WhatsApp session not found.',
        });
      }

      // Take control of the response
      reply.hijack();

      // -------------------------
      // CORS
      // -------------------------

      const origin = request.headers.origin;

      const allowedOrigins = [
        'http://localhost:3000',
        'https://phoneo-xi.vercel.app',
      ];

      if (origin && allowedOrigins.includes(origin)) {
        reply.raw.setHeader(
          'Access-Control-Allow-Origin',
          origin
        );
      }

      reply.raw.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS'
      );

      reply.raw.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );

      // -------------------------
      // SSE headers
      // -------------------------

      reply.raw.setHeader(
        'Content-Type',
        'text/event-stream; charset=utf-8'
      );

      reply.raw.setHeader(
        'Cache-Control',
        'no-cache, no-transform'
      );

      reply.raw.setHeader(
        'Connection',
        'keep-alive'
      );

      reply.raw.setHeader(
        'X-Accel-Buffering',
        'no'
      );

      reply.raw.flushHeaders();

      console.log(
        `SSE connected for session: ${sessionId}`
      );

      // Initial SSE message
      reply.raw.write(': connected\n\n');

      // Register browser
      addClient(
        sessionId,
        reply.raw
      );

      // -------------------------
      // SEND CURRENT STATE
      // -------------------------

      if (
        session.status === 'qr' &&
        session.qr
      ) {
        reply.raw.write(
          `event: qr\n` +
          `data: ${JSON.stringify({
            qr: session.qr,
          })}\n\n`
        );
      }

      if (session.status === 'connecting') {
        reply.raw.write(
          `event: connecting\n` +
          `data: {}\n\n`
        );
      }

      if (session.status === 'connected') {
        reply.raw.write(
          `event: connected\n` +
          `data: ${JSON.stringify({
            phoneNumber: session.phoneNumber,
          })}\n\n`
        );
      }

      if (session.status === 'failed') {
        reply.raw.write(
          `event: failed\n` +
          `data: ${JSON.stringify({
            message: 'WhatsApp connection failed.',
          })}\n\n`
        );
      }

      // -------------------------
      // HEARTBEAT
      // -------------------------

      const heartbeat = setInterval(() => {
        if (!reply.raw.destroyed) {
          reply.raw.write(': heartbeat\n\n');
        }
      }, 15000);

      // -------------------------
      // DISCONNECT
      // -------------------------

      request.raw.on('close', () => {
        console.log(
          `SSE disconnected: ${sessionId}`
        );

        clearInterval(heartbeat);

        removeClient(
          sessionId,
          reply.raw
        );
      });
    }
  );
}