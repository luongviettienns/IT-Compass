import { afterEach, describe, expect, it, vi } from 'vitest';
import { blogApi } from '../src/lib/blogApi';
import { userApi } from '../src/lib/userApi';
import { API_ORIGIN } from '../src/lib/authApi';

afterEach(() => { vi.unstubAllGlobals(); });
describe('upload response URL compatibility', () => {
  it.each([['profile', userApi], ['CMS', blogApi]])('resolves %s relative image URLs against the API origin', async (_name, api) => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({url:'/uploads/img_fixture.webp',filename:'img_fixture.webp'}), {status:201,headers:{'content-type':'application/json'}})));
    const result = await api.uploadImage(new File(['test'], 'fixture.png', {type:'image/png'}));
    expect(result.url).toBe(`${API_ORIGIN}/uploads/img_fixture.webp`);
    expect(result.filename).toBe('img_fixture.webp');
  });
});
