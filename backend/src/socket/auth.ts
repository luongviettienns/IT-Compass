import type { User } from '@prisma/client';
import type { Socket } from 'socket.io';

import { prisma } from '../db/prisma.js';
import { HttpError } from '../utils/httpError.js';
import { verifyAccessToken } from '../utils/tokens.js';

export type AuthenticatedSocket = Socket & {
  user: User;
};

const readSocketToken = (socket: Socket) => {
  const token = socket.handshake.auth.token;
  return typeof token === 'string' && token.trim() ? token.trim() : null;
};

export const authenticateSocket = async (socket: Socket) => {
  const token = readSocketToken(socket);
  if (!token) {
    throw new HttpError(401, 'Missing access token', undefined, 'AUTH_MISSING_ACCESS_TOKEN');
  }

  const payload = verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: BigInt(payload.sub) },
  });

  if (!user) {
    throw new HttpError(401, 'User not found', undefined, 'AUTH_USER_NOT_FOUND');
  }

  if (user.status !== 'ACTIVE') {
    throw new HttpError(403, 'Account is not active', undefined, 'AUTH_ACCOUNT_NOT_ACTIVE');
  }

  return user;
};

export const isAuthenticatedSocket = (socket: Socket): socket is AuthenticatedSocket => 'user' in socket;
