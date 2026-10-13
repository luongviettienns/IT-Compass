import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const doubles=vi.hoisted(()=>({
  env:{rateLimitUseRedis:true,redisUrl:'redis://test-only'},
  client:{on:vi.fn(),connect:vi.fn(),destroy:vi.fn(),isReady:false},
  factory:vi.fn(),
}));
vi.mock('../src/config/env.js',()=>({env:doubles.env}));
vi.mock('../src/utils/logger.js',()=>({logger:{warn:vi.fn(),info:vi.fn()}}));
vi.mock('redis',()=>({createClient:doubles.factory}));
beforeEach(()=>{vi.resetModules();vi.useFakeTimers();doubles.env.redisUrl='redis://test-only';doubles.env.rateLimitUseRedis=true;doubles.client.isReady=false;doubles.factory.mockReturnValue(doubles.client);});
afterEach(()=>vi.useRealTimers());
describe('rate limit Redis connection',()=>{
  it('backs off failed connections and permits recovery after five seconds',async()=>{
    doubles.client.connect.mockRejectedValueOnce(new Error('connection unavailable')).mockImplementationOnce(async()=>{doubles.client.isReady=true;});
    const {getRedisClient}=await import('../src/config/redis.js');
    expect(await getRedisClient()).toBeNull();
    expect(await getRedisClient()).toBeNull();
    expect(doubles.factory).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(5000);
    expect(await getRedisClient()).toBe(doubles.client);
    expect(doubles.factory.mock.calls[0][0]).toMatchObject({disableOfflineQueue:true,socket:{connectTimeout:2000,reconnectStrategy:false}});
  });
  it('returns unavailable rather than pretending a missing Redis URL is connected',async()=>{
    doubles.env.redisUrl='';
    const {getRedisClient}=await import('../src/config/redis.js');
    expect(await getRedisClient()).toBeNull();
    expect(doubles.factory).not.toHaveBeenCalled();
  });
  it('times out the full handshake and destroys a hung client',async()=>{
    doubles.client.connect.mockImplementation(()=>new Promise(()=>{}));
    const {getRedisClient}=await import('../src/config/redis.js');
    const pending=getRedisClient();
    await vi.advanceTimersByTimeAsync(2001);
    expect(await pending).toBeNull();
    expect(doubles.client.destroy).toHaveBeenCalledTimes(1);
  });
});
