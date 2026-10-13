import { createServer, request as httpRequest, type Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import express from 'express';
import sharp from 'sharp';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const doubles = vi.hoisted(() => {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'mysql://test@127.0.0.1:1/itcompass_security_test';
  process.env.RATE_LIMIT_USE_REDIS = 'false';
  process.env.TRUSTED_PROXIES = '';
  return { user: { findUnique: vi.fn() }, redis: vi.fn(), invalidate:vi.fn() };
});
vi.mock('../src/db/prisma.js', () => ({ prisma: { user: doubles.user } }));
vi.mock('../src/config/redis.js', () => ({ getRedisClient: doubles.redis, invalidateRedisClient:doubles.invalidate }));
vi.mock('../src/utils/logger.js', () => ({ logger: { info:vi.fn(), warn:vi.fn(), error:vi.fn() } }));
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { uploadDirectory } from '../src/config/upload.js';
import { createRateLimiter } from '../src/middlewares/rate-limit.middleware.js';
import { generateAccessToken } from '../src/utils/tokens.js';
import { parseTrustedProxies } from '../src/config/proxy.js';

let server: Server;
let origin: string;
const files = new Set<string>();
const actor = { id:71n, fullName:'Test Upload', email:'upload@example.test', role:'STUDENT' as const, status:'ACTIVE' as const };
const token = generateAccessToken(actor);
let png: Buffer;
beforeAll(async () => {
  png = await sharp({create:{width:2,height:2,channels:3,background:'#4682b4'}}).png().toBuffer();
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No listener');
  origin = `http://127.0.0.1:${address.port}`;
});
beforeEach(() => { env.metricsToken = undefined; env.rateLimitUseRedis = false; doubles.user.findUnique.mockResolvedValue(actor); });
afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  for (const filename of files) {
    const target = path.resolve(uploadDirectory, filename);
    if (path.dirname(target) !== uploadDirectory || !/^img_[\w-]+\.(png|jpg|jpeg|gif|webp)$/.test(filename)) throw new Error('Unexpected test file path');
    await fs.unlink(target).catch((error: NodeJS.ErrnoException) => { if (error.code !== 'ENOENT') throw error; });
  }
});
const upload = async (bytes: Buffer, name = 'test.png', type = 'image/png', authorization: string | null = token) => {
  const form = new FormData();
  form.append('image', new Blob([new Uint8Array(bytes)], {type}), name);
  const response = await fetch(`${origin}/api/uploads/images`, { method:'POST', body:form, headers:authorization ? {authorization:`Bearer ${authorization}`, host:'attacker.invalid'} : {} });
  const body = await response.json();
  if (body.filename) files.add(body.filename);
  return { response, body };
};
const withLimiterServer = async (trust: false | string[], run: (base: string) => Promise<void>) => {
  const isolated = express();
  isolated.set('trust proxy', trust);
  isolated.post('/limited', createRateLimiter({ name:randomUUID(), windowMs:60000, maxRequests:2 }), (req,res) => res.json({ip:req.ip}));
  isolated.use((error: { statusCode:number; code?:string }, _req:express.Request, res:express.Response, next:express.NextFunction) => { void next; res.status(error.statusCode || 500).json({code:error.code}); });
  const listener = isolated.listen(0,'127.0.0.1');
  await new Promise<void>(resolve => listener.once('listening',resolve));
  const address=listener.address();
  if (!address || typeof address === 'string') throw new Error('No listener');
  try { await run(`http://127.0.0.1:${address.port}`); }
  finally { listener.closeAllConnections(); await new Promise<void>(resolve=>listener.close(()=>resolve())); }
};

describe('private metrics and headers', () => {
  it('disables metrics when the server token is missing', async () => {
    const response = await fetch(`${origin}/api/metrics`);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain('totalRequests');
  });
  it('requires the configured token and marks successful metrics private', async () => {
    env.metricsToken = 'test-only-metrics-secret';
    for (const value of [undefined, 'wrong-token']) {
      const response = await fetch(`${origin}/api/metrics`, { headers:value ? {'x-metrics-token':value} : {} });
      expect(response.status).toBe(403);
    }
    const response = await fetch(`${origin}/api/metrics`, { headers:{'x-metrics-token':env.metricsToken} });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('does not record arbitrary identifiers or query secrets in metric labels', async () => {
    await fetch(`${origin}/not-a-route/private-person-73?token=never-a-metric-label`);
    env.metricsToken = 'test-only-metrics-secret';
    const response = await fetch(`${origin}/api/metrics`, { headers:{'x-metrics-token':env.metricsToken} });
    const content = await response.text();
    expect(content).not.toContain('private-person-73');
    expect(content).not.toContain('never-a-metric-label');
  });
  it('sends protective API headers without exposing server details', async () => {
    const response = await fetch(`${origin}/api/health`);
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('content-security-policy')).toContain("default-src 'none'");
    expect(response.headers.get('x-powered-by')).toBeNull();
  });
});

describe('rate limit identity', () => {
  it('ignores rotating forged XFF headers on direct requests', async () => {
    const isolated = express();
    isolated.post('/limited', createRateLimiter({ name:randomUUID(), windowMs:60000, maxRequests:2 }), (_req,res) => res.sendStatus(204));
    isolated.use((error: { statusCode:number }, _req:express.Request, res:express.Response, next:express.NextFunction) => { void next; res.sendStatus(error.statusCode || 500); });
    const listener = isolated.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => listener.once('listening', resolve));
    const address = listener.address();
    if (!address || typeof address === 'string') throw new Error('No listener');
    try {
      const statuses = [];
      for (let i=0;i<3;i++) statuses.push((await fetch(`http://127.0.0.1:${address.port}/limited`, {method:'POST', headers:{'x-forwarded-for':`203.0.113.${i+1}`}})).status);
      expect(statuses).toEqual([204,204,429]);
    } finally { listener.closeAllConnections(); await new Promise<void>(resolve => listener.close(() => resolve())); }
  });
  it('does not trust a hop count by default', () => { expect(app.get('trust proxy')).toBe(false); });
  it('takes the nearest untrusted hop instead of a forged leading address', async () => {
    await withLimiterServer(['127.0.0.1','::1'], async base => {
      for (let i=0;i<3;i++) {
        const response=await fetch(`${base}/limited`,{method:'POST',headers:{'x-forwarded-for':`198.51.100.${i+1}, 203.0.113.17`}});
        expect(response.status).toBe(i<2?200:429);
        if (i<2) expect((await response.json()).ip).toBe('203.0.113.17');
      }
    });
  });
  it('does not honor forwarded clients through an untrusted immediate peer', async () => {
    await withLimiterServer(['10.0.0.0/24'], async base => {
      const response=await fetch(`${base}/limited`,{method:'POST',headers:{'x-forwarded-for':'203.0.113.17'}});
      expect((await response.json()).ip).toMatch(/127\.0\.0\.1$/);
    });
  });
  it.each(['true','1','loopback','0.0.0.0/0','::/0','127.0.0.1/33','::1/129','invalid','127.0.0.1,'])('rejects unsafe or invalid proxy config %s', value => { expect(()=>parseTrustedProxies(value)).toThrow(); });
  it('supports explicit IPv4/IPv6 proxies and defaults off', () => {
    expect(parseTrustedProxies('')).toBe(false);
    expect(parseTrustedProxies('127.0.0.1,::1,10.0.0.0/24')).toEqual(['127.0.0.1','::1','10.0.0.0/24']);
  });
  it('does not fall back to a fresh memory quota when Redis is unavailable', async () => {
    env.rateLimitUseRedis=true;
    doubles.redis.mockResolvedValue(null);
    await withLimiterServer(false, async base => {
      const response=await fetch(`${base}/limited`,{method:'POST'});
      expect(response.status).toBe(503);
      expect((await response.json()).code).toBe('RATE_LIMIT_UNAVAILABLE');
      expect(response.headers.get('retry-after')).toBe('5');
    });
  });
  it('performs one atomic Redis command and rejects command failures', async () => {
    env.rateLimitUseRedis=true;
    const evalCommand=vi.fn().mockResolvedValueOnce([1,60000]).mockResolvedValueOnce([3,59999]).mockRejectedValueOnce(new Error('Redis disconnected'));
    doubles.redis.mockResolvedValue({eval:evalCommand});
    await withLimiterServer(false, async base => {
      const statuses=[];
      for (let i=0;i<3;i++) statuses.push((await fetch(`${base}/limited`,{method:'POST'})).status);
      expect(statuses).toEqual([200,429,503]);
      expect(evalCommand).toHaveBeenCalledTimes(3);
      expect(evalCommand.mock.calls[0][0]).toContain("redis.call('PEXPIRE'");
    });
  });
  it('fails closed within the deadline when a Redis command never responds', async () => {
    env.rateLimitUseRedis=true;
    doubles.redis.mockResolvedValue({eval:()=>new Promise(()=>{})});
    vi.useFakeTimers();
    try {
      const next=vi.fn();
      const res={setHeader:vi.fn()} as unknown as express.Response;
      const pending=createRateLimiter({name:randomUUID(),windowMs:60000,maxRequests:2})({ip:'127.0.0.1'} as express.Request,res,next);
      await vi.advanceTimersByTimeAsync(2001);
      await pending;
      expect(next.mock.calls[0][0]).toMatchObject({statusCode:503,code:'RATE_LIMIT_UNAVAILABLE'});
      expect(doubles.invalidate).toHaveBeenCalledTimes(1);
    } finally { vi.useRealTimers(); }
  });
});

describe('verified uploads', () => {
  it.each([
    ['HTML', Buffer.from('<html><script>alert(1)</script></html>')],
    ['SVG', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')],
    ['executable', Buffer.from('MZ executable bytes')],
    ['truncated PNG', Buffer.from('89504e470d0a1a0a', 'hex')],
  ])('rejects %s disguised as a PNG', async (_label, data) => {
    const result = await upload(data);
    expect(result.response.status).toBe(400);
    expect(result.body.code).toBe('UPLOAD_INVALID_IMAGE_CONTENT');
  });
  it('requires authentication and an active account', async () => {
    expect((await upload(png, 'test.png', 'image/png', null)).response.status).toBe(401);
    doubles.user.findUnique.mockResolvedValue({...actor,status:'SUSPENDED'});
    expect((await upload(png)).response.status).toBe(403);
  });
  it('rejects an image whose declared type differs from its bytes', async () => {
    const result=await upload(png,'spoof.jpg','image/jpeg');
    expect(result.response.status).toBe(400);
    expect(result.body.code).toBe('UPLOAD_INVALID_IMAGE_CONTENT');
  });
  it('rejects oversized input before publishing it', async () => {
    const result=await upload(Buffer.alloc(env.uploadMaxFileSizeMb*1024*1024+1));
    expect(result.response.status).toBe(400);
    expect(result.body.code).toBe('UPLOAD_FILE_TOO_LARGE');
  });
  it('rejects a compressed image with excessive decoded pixels', async () => {
    const giant=await sharp({create:{width:4001,height:4000,channels:3,background:'white'}}).png().toBuffer();
    expect(giant.length).toBeLessThan(1024*1024);
    const result=await upload(giant);
    expect(result.response.status).toBe(400);
    expect(result.body.code).toBe('UPLOAD_INVALID_IMAGE_CONTENT');
  });
  it.each(['jpeg','png','webp','gif'] as const)('decodes and publishes actual %s content', async format => {
    const data=await sharp({create:{width:4,height:4,channels:3,background:'#648cff'}}).toFormat(format).toBuffer();
    const result=await upload(data,`input.${format}`,`image/${format}`);
    expect(result.response.status,JSON.stringify(result.body)).toBe(201);
    const bytes=await fs.readFile(path.join(uploadDirectory,result.body.filename));
    expect((await sharp(bytes).metadata()).format).toBe('webp');
  });
  it('strips EXIF metadata and an appended HTML payload through re-encoding', async () => {
    const jpeg=await sharp({create:{width:4,height:4,channels:3,background:'white'}}).withExif({IFD0:{Artist:'private-metadata-fixture'}}).jpeg().toBuffer();
    const result=await upload(Buffer.concat([jpeg,Buffer.from('<script>payload-marker</script>')]),'input.jpg','image/jpeg');
    expect(result.response.status,JSON.stringify(result.body)).toBe(201);
    const bytes=await fs.readFile(path.join(uploadDirectory,result.body.filename));
    expect(bytes.includes(Buffer.from('payload-marker'))).toBe(false);
    expect((await sharp(bytes).metadata()).exif).toBeUndefined();
  });
  it('preserves permitted animation and rejects excessive frame counts', async () => {
    const frames = async (count:number) => {
      const raw=Buffer.alloc(4*4*3*count);
      for(let i=0;i<count;i++) raw.fill(i%2 ? 255 : 0, i*48, (i+1)*48);
      return sharp(raw, {raw:{width:4,height:4*count,channels:3,pageHeight:4}}).gif({delay:Array(count).fill(100),keepDuplicateFrames:true}).toBuffer();
    };
    const valid=await upload(await frames(2),'animation.gif','image/gif');
    expect(valid.response.status,JSON.stringify(valid.body)).toBe(201);
    expect((await sharp(await fs.readFile(path.join(uploadDirectory,valid.body.filename)),{animated:true}).metadata()).pages).toBe(2);
    const invalid=await upload(await frames(101),'animation.gif','image/gif');
    expect(invalid.response.status).toBe(400);
    expect(invalid.body.code).toBe('UPLOAD_INVALID_IMAGE_CONTENT');
  });
  it('does not reflect a forged HTTP Host in the upload response', async () => {
    const form=new FormData(); form.append('image',new Blob([new Uint8Array(png)],{type:'image/png'}),'valid.png');
    const encoded=new Request(`${origin}/api/uploads/images`,{method:'POST',body:form});
    const payload=Buffer.from(await encoded.arrayBuffer());
    const result=await new Promise<{status:number; body:{filename:string;url:string}}>((resolve,reject)=>{
      const req=httpRequest(`${origin}/api/uploads/images`,{method:'POST',headers:{host:'attacker.invalid','content-type':encoded.headers.get('content-type')!,'content-length':payload.length,authorization:`Bearer ${token}`}},res=>{
        const chunks:Buffer[]=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode!,body:JSON.parse(Buffer.concat(chunks).toString())}));
      });req.on('error',reject);req.end(payload);
    });
    files.add(result.body.filename);
    expect(result.status).toBe(201);
    expect(result.body.url).toBe(`/uploads/${result.body.filename}`);
  });
  it('re-encodes a valid image and never uses client Host to construct its URL', async () => {
    const {response,body} = await upload(png);
    expect(response.status, JSON.stringify(body)).toBe(201);
    expect(body.url).toBe(`/uploads/${body.filename}`);
    expect(body.filename).toMatch(/\.webp$/);
    const imageResponse = await fetch(`${origin}${body.url}`);
    expect(imageResponse.headers.get('content-type')).toContain('image/webp');
    expect(imageResponse.headers.get('x-content-type-options')).toBe('nosniff');
    expect(imageResponse.headers.get('cross-origin-resource-policy')).toBe('cross-origin');
  });
});
