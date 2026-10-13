import { EventEmitter } from 'node:events';
import type { Request,Response } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createUploadAdmission } from '../src/middlewares/upload-admission.middleware.js';
afterEach(()=>vi.useRealTimers());
const client=()=>({req:{destroy:vi.fn()} as unknown as Request,res:Object.assign(new EventEmitter(),{setHeader:vi.fn()}) as unknown as Response,next:vi.fn()});
describe('upload admission before buffering',()=>{
  it('admits only four readers, rejects the fifth and reuses a finished slot',()=>{
    const gate=createUploadAdmission();
    const clients=Array.from({length:5},client);
    for(const c of clients) gate(c.req,c.res,c.next);
    for(const c of clients.slice(0,4)) expect(c.next).toHaveBeenCalledWith();
    expect(clients[4].next.mock.calls[0][0]).toMatchObject({statusCode:503,code:'UPLOAD_BUSY'});
    clients[0].res.emit('finish');
    const retry=client();gate(retry.req,retry.res,retry.next);
    expect(retry.next).toHaveBeenCalledWith();
    for(const c of [...clients,retry]) c.res.emit('close');
  });
  it('releases an aborted slot once even if finish and close both occur',()=>{
    const gate=createUploadAdmission(1);
    const first=client();gate(first.req,first.res,first.next);first.res.emit('close');first.res.emit('finish');
    const second=client();gate(second.req,second.res,second.next);
    const third=client();gate(third.req,third.res,third.next);
    expect(second.next).toHaveBeenCalledWith();
    expect(third.next.mock.calls[0][0]).toMatchObject({statusCode:503});
    second.res.emit('close');
  });
  it('destroys a stalled upload after thirty seconds and clears completed timers',async()=>{
    vi.useFakeTimers();const gate=createUploadAdmission();
    const stalled=client();const finished=client();
    gate(stalled.req,stalled.res,stalled.next);gate(finished.req,finished.res,finished.next);finished.res.emit('finish');
    await vi.advanceTimersByTimeAsync(30001);
    expect(stalled.req.destroy).toHaveBeenCalledTimes(1);
    expect(finished.req.destroy).not.toHaveBeenCalled();
    stalled.res.emit('close');
  });
});
