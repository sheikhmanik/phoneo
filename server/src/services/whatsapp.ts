import { randomUUID } from 'crypto';
import { Client, LocalAuth } from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { ensureUser } from './user';
import { PrismaClient } from '@prisma/client';

export type WhatsAppStatus =
  | 'starting'
  | 'qr'
  | 'connecting'
  | 'connected'
  | 'failed';

export interface WhatsAppSession {
  id: string;
  status: WhatsAppStatus;
  qr?: string;
  phoneNumber?: string | undefined;
  client: Client;
  clients: Set<NodeJS.WritableStream>;
}

const sessions = new Map<string, WhatsAppSession>();

export async function createSession(prisma: PrismaClient) {
  const sessionId = randomUUID();

  const client = new Client({
    authStrategy: new LocalAuth({
      clientId: sessionId,
      dataPath: './.wwebjs_auth',
    }),
    puppeteer: {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
      ],
    },
  });

  const session: WhatsAppSession = {
    id: sessionId,
    status: 'starting',
    client,
    clients: new Set(),
  };

  sessions.set(sessionId, session);

  /*
   * QR CODE
   */
  client.on('qr', async (qr) => {
    console.log(`QR received for session: ${sessionId}`);

    try {
      const qrDataUrl = await QRCode.toDataURL(qr);

      updateSession(sessionId, {
        status: 'qr',
        qr: qrDataUrl,
      });
    } catch (error) {
      console.error('Failed to generate QR image:', error);

      updateSession(sessionId, {
        status: 'failed',
      });
    }
  });

  /*
   * AUTHENTICATED
   *
   * The phone successfully scanned the QR.
   */
  client.on('authenticated', () => {
    console.log(
      `WhatsApp authenticated: ${sessionId}`
    );

    updateSession(sessionId, {
      status: 'connecting',
    });
  });

  /*
   * READY
   *
   * WhatsApp Web is fully connected.
   */
  client.on('ready', async () => {
    console.log(
      `WhatsApp connected: ${sessionId}`
    );
  
    const phoneNumber =
      client.info?.wid?.user;
  
    if (!phoneNumber) {
      console.error(
        `Could not determine WhatsApp phone number: ${sessionId}`
      );
  
      updateSession(sessionId, {
        status: 'failed',
      });
  
      return;
    }
  
    const formattedPhone =
      `+${phoneNumber}`;
  
    try {
      await ensureUser(prisma, formattedPhone);
  
      console.log(
        `User verified/created: ${formattedPhone}`
      );
    } catch (error) {
      console.error(
        `Failed to create/find user: ${formattedPhone}`,
        error
      );
  
      updateSession(sessionId, {
        status: 'failed',
      });
  
      return;
    }
  
    updateSession(sessionId, {
      status: 'connected',
      phoneNumber: formattedPhone,
    });
  });

  /*
   * AUTHENTICATION FAILURE
   */
  client.on('auth_failure', (message) => {
    console.error(
      `WhatsApp authentication failed: ${sessionId}`,
      message
    );

    updateSession(sessionId, {
      status: 'failed',
    });
  });

  /*
   * DISCONNECTED
   */
  client.on('disconnected', (reason) => {
    console.log(
      `WhatsApp disconnected: ${sessionId}`,
      reason
    );

    updateSession(sessionId, {
      status: 'failed',
    });
  });

  /*
   * GENERAL ERROR
   */
  client.on('error', (error) => {
    console.error(
      `WhatsApp client error: ${sessionId}`,
      error
    );

    updateSession(sessionId, {
      status: 'failed',
    });
  });

  /*
   * Start WhatsApp Web
   */
  client.initialize().catch((error) => {
    console.error(
      `Failed to initialize WhatsApp: ${sessionId}`,
      error
    );

    updateSession(sessionId, {
      status: 'failed',
    });
  });

  return session;
}

export function getSession(sessionId: string) {
  return sessions.get(sessionId);
}

export async function removeSession(sessionId: string) {
  const session = sessions.get(sessionId);

  if (!session) {
    return false;
  }

  // Close SSE clients
  for (const client of session.clients) {
    try {
      client.end();
    } catch {
      // Client may already be closed
    }
  }

  session.clients.clear();

  // Logout WhatsApp account
  try {
    await session.client.logout();
  } catch (error) {
    console.error(
      `Failed to logout WhatsApp session ${sessionId}:`,
      error
    );
  }

  // Destroy WhatsApp client
  try {
    await session.client.destroy();
  } catch (error) {
    console.error(
      `Failed to destroy WhatsApp client ${sessionId}:`,
      error
    );
  }

  // Remove from memory
  sessions.delete(sessionId);

  console.log(
    `WhatsApp session removed: ${sessionId}`
  );

  return true;
}

export function addClient(
  sessionId: string,
  client: NodeJS.WritableStream
) {
  const session = sessions.get(sessionId);

  if (!session) {
    return false;
  }

  session.clients.add(client);

  return true;
}

export function removeClient(
  sessionId: string,
  client: NodeJS.WritableStream
) {
  const session = sessions.get(sessionId);

  if (!session) {
    return;
  }

  session.clients.delete(client);
}

export function updateSession(
  sessionId: string,
  update: Partial<WhatsAppSession>
) {
  const session = sessions.get(sessionId);

  if (!session) {
    console.log(
      `Session not found: ${sessionId}`
    );

    return;
  }

  Object.assign(session, update);

  console.log(
    `Session ${sessionId} updated:`,
    session.status,
    `clients: ${session.clients.size}`
  );

  broadcast(session);
}

function broadcast(session: WhatsAppSession) {
  for (const client of session.clients) {
    sendState(session, client);
  }
}

function sendState(
  session: WhatsAppSession,
  response: NodeJS.WritableStream
) {
  if (session.status === 'qr' && session.qr) {
    response.write(
      `event: qr\n` +
      `data: ${JSON.stringify({
        qr: session.qr,
      })}\n\n`
    );

    return;
  }

  if (session.status === 'connecting') {
    response.write(
      `event: connecting\n` +
      `data: {}\n\n`
    );

    return;
  }

  if (session.status === 'connected') {
    response.write(
      `event: connected\n` +
      `data: ${JSON.stringify({
        phoneNumber: session.phoneNumber,
      })}\n\n`
    );

    return;
  }

  if (session.status === 'failed') {
    response.write(
      `event: failed\n` +
      `data: ${JSON.stringify({
        message: 'WhatsApp connection failed.',
      })}\n\n`
    );
  }
}