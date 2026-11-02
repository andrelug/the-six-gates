import raw from '@content/config.json';

export type Config = typeof raw;
export const config: Config = raw;
