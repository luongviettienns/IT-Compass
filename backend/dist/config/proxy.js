import { isIP } from 'node:net';
/** Only named proxy IPs/CIDRs; never infer trust from the number of hops. */
export const parseTrustedProxies = (value) => {
    if (!value?.trim())
        return false;
    const entries = value.split(',').map((entry) => entry.trim());
    for (const entry of entries) {
        const [address, prefix, extra] = entry.split('/');
        const family = isIP(address);
        const maxPrefix = family === 4 ? 32 : 128;
        if (!family || extra !== undefined || (prefix !== undefined && (!/^\d+$/.test(prefix) || Number(prefix) < 1 || Number(prefix) > maxPrefix))) {
            throw new Error('TRUSTED_PROXIES must contain explicit proxy IP addresses or CIDRs (no /0, aliases, booleans or hop counts)');
        }
    }
    return [...new Set(entries)];
};
