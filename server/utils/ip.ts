import os from 'node:os';

export type IPFamily = 'IPv4' | 'IPv6';

export type IPDetails = {
  ip: string;
  adapter: string;
  family: IPFamily;
  internal: boolean;
};

export function getAllLocalAdapterIP(): IPDetails[] {
  // Get all network interfaces
  const interfaces = os.networkInterfaces();
  const allAddresses: IPDetails[] = [];

  for (const [interfaceName, networkInterface] of Object.entries(interfaces)) {
    if (!networkInterface) continue;

    for (const info of networkInterface) {
      // You can filter out internal/loopback addresses (like 127.0.0.1) if you only want external ones
      allAddresses.push({
        ip: info.address,
        adapter: interfaceName,
        family: info.family, // 'IPv4' or 'IPv6'
        internal: info.internal,
      });
    }
  }

  return allAddresses;
}
