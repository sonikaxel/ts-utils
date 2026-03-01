export * from './fixed-window';
export * from './sliding-window-log';

export function createLimiterIndentity(ip: string, name: string) {
  return `${ip}:${name}`;
}
