import { FastifyInstance } from 'fastify';

import { createAndSendInvoice } from '../services/invoice';

interface CreateInvoiceBody {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  description: string;
  amount: number;
  message?: string | '';
}

export async function invoiceRoutes(fastify: FastifyInstance) {
  
  fastify.post<{ Body: CreateInvoiceBody }>('/', async (request, reply) => {
    
    const {
      sessionId,
      customerName,
      customerPhone,
      description,
      amount,
      message,
    } = request.body;

    if (!sessionId) {
      return reply.code(400).send({
        message:
          'Session ID is required.',
      });
    }

    if (!customerName?.trim()) {
      return reply.code(400).send({
        message:
          'Customer name is required.',
      });
    }

    if (!customerPhone?.trim()) {
      return reply.code(400).send({
        message:
          'Customer WhatsApp number is required.',
      });
    }

    if (!description?.trim()) {
      return reply.code(400).send({
        message:
          'Invoice description is required.',
      });
    }

    if (
      typeof amount !== 'number' ||
      amount <= 0
    ) {
      return reply.code(400).send({
        message:
          'A valid amount is required.',
      });
    }

    try {
      const invoice =
        await createAndSendInvoice(
          fastify.prisma,
          {
            sessionId,
            customerName:
              customerName.trim(),
            customerPhone:
              customerPhone.trim(),
            description:
              description.trim(),
            amount,
            message:
              message?.trim() ?? '',
          }
        );
    
      return reply.code(201).send({
        success: true,
        message:
          'Invoice sent successfully via WhatsApp.',
        invoice,
      });
    
    } catch (error) {
      fastify.log.error(error);
    
      return reply.code(500).send({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create and send invoice.',
      });
    }
  });

  fastify.get('/get-invoices', async (request, reply) => {
    try {
      const invoices = await fastify.prisma.invoice.findMany({
        orderBy: {
          invoiceDate: 'desc',
        },
      });

      return reply.send({ invoices });
    } catch (error) {
      fastify.log.error(error);

      return reply.code(500).send({
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch invoices.',
      });
    }
  });
}