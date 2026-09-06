import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

import { getSession } from './whatsapp';

export interface CreateInvoiceInput {
  sessionId: string;
  customerName: string;
  customerPhone: string;
  description: string;
  amount: number;
  message?: string;
}

export async function createAndSendInvoice(
  prisma: PrismaClient,
  data: CreateInvoiceInput
) {
  const session = getSession(
    data.sessionId
  );

  if (!session) {
    throw new Error(
      'WhatsApp session not found.'
    );
  }

  if (session.status !== 'connected') {
    throw new Error(
      'WhatsApp is not connected.'
    );
  }

  if (!session.phoneNumber) {
    throw new Error(
      'WhatsApp phone number not found.'
    );
  }

  // Find logged-in user
  const user = await prisma.user.findUnique({
    where: {
      phone: session.phoneNumber,
    },
  });

  if (!user) {
    throw new Error(
      'User not found.'
    );
  }

  // Generate invoice number
  const invoiceNumber =
    `INV-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '')}-${randomUUID()
      .replace(/-/g, '')
      .slice(0, 6)
      .toUpperCase()}`;

  const invoiceDate = new Date();

  const phone =
    data.customerPhone.replace(
      /\D/g,
      ''
    );

  if (!phone) {
    throw new Error(
      'Invalid customer WhatsApp number.'
    );
  }

  const chatId = `${phone}@c.us`;

  const invoiceMessage = `
*INVOICE*

Invoice Number: ${invoiceNumber}
Date: ${invoiceDate
    .toISOString()
    .split('T')[0]}

*Customer*
${data.customerName}

*Description*
${data.description}

*Amount*
₹${data.amount.toFixed(2)}

${data.message ?? ''}

Thank you.
`.trim();

  console.log(
    'WhatsApp client state:',
    await session.client.getState()
  );

  if (!session.client.info) {
    throw new Error('WhatsApp client is not ready.');
  }

  if (!session.client.pupPage) {
    throw new Error('WhatsApp Web page is not available.');
  }

  // phone number checking..
  const phoneNumber = data.customerPhone.replace(/\D/g, '');
  if (!phoneNumber) {
    throw new Error(
      'Please enter a valid WhatsApp number.'
    );
  }
  const numberId = await session.client.getNumberId(phoneNumber);
  console.log('Number ID:', numberId);
  if (!numberId) {
    throw new Error(
      'This phone number is not registered on WhatsApp.'
    );
  }

  await session.client.sendMessage(
    numberId._serialized,
    invoiceMessage
  );

  // Create invoice in database
  const invoice =
    await prisma.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate,

        customerName:
          data.customerName,

        customerPhone:
          data.customerPhone,

        amount:
          data.amount,

        sentFrom:
          session.phoneNumber,

        description:
          data.description,

        message:
          data.message ?? '',

        userId:
          user.id,
      },
    });

  return invoice;
}