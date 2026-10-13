import { createServer, type Socket } from 'node:net';
import { describe, expect, it, vi } from 'vitest';
const config=vi.hoisted(()=>({rateLimitUseRedis:true,redisUrl:''}));
vi.mock('../src/config/env.js',()=>({env:config}));
vi.mock('../src/utils/logger.js',()=>({logger:{warn:vi.fn(),info:vi.fn()}}));
import { getRedisClient } from '../src/config/redis.js';
describe('real Redis SDK stalled handshake',()=>{
  it('closes a TCP peer that accepts the connection but never replies to RESP',async()=>{
    const sockets=new Set<Socket>();
    const peer=createServer(socket=>{sockets.add(socket);socket.on('data',()=>{});socket.on('close',()=>sockets.delete(socket));});
    await new Promise<void>(resolve=>peer.listen(0,'127.0.0.1',resolve));
    const address=peer.address();if(!address || typeof address==='string') throw new Error('No test peer');
    config.redisUrl=`redis://127.0.0.1:${address.port}`;
    try {
      const started=Date.now();
      expect(await getRedisClient()).toBeNull();
      expect(Date.now()-started).toBeLessThan(4000);
    } finally { for(const socket of sockets) socket.destroy();await new Promise<void>(resolve=>peer.close(()=>resolve())); }
  });
});
