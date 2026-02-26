import { Client as PgClient, Notification as PgNotification } from 'pg';

type PgClientAgentOptions<T extends string> = {
  /** Channels for listeners */
  channels?: T[];
  /** Disable console log when listerer is attached */
  disableLogs?: boolean;
};

export function pgClientAgent<const T extends string>(
  pgClient: PgClient,
  opts: PgClientAgentOptions<T> = {},
) {
  const { channels, disableLogs } = opts;

  async function connect(msg?: string) {
    try {
      await pgClient.connect();
      console.log(prefixLine('DB'), msg ?? 'Connected');
    } catch (err) {
      console.error(prefixLine('DB'), 'Connection failed\n', err);
      throw new Error('Failed to connect database');
    }
    return pgClient;
  }

  async function attachListener(channel: T) {
    try {
      await pgClient.query(`LISTEN ${channel}`);
      if (!disableLogs) {
        console.log(prefixLine('DB'), `Listening for ${channel}...`);
      }
    } catch (e) {
      console.error(prefixLine('DB'), 'Listening failed\n', e);
    }

    return pgClient;
  }

  async function attachListenerAll() {
    if (channels) {
      for (const channel of channels) {
        await attachListener(channel);
      }
    }
  }

  function matchChannel(channel: PgNotification['channel']) {
    return channels?.find((d) => d === channel) ?? null;
  }

  async function notifyListener(channel: T, payload?: unknown) {
    let sql = `NOTIFY ${channel}`;

    if (payload) {
      sql += `, '${JSON.stringify(payload)}'`;
    }

    try {
      await pgClient.query(sql);
    } catch (e) {
      console.error(prefixLine('DB'), 'Notify failed\n', e);
    }
    return pgClient;
  }

  function prefixLine(prefix: string) {
    return `${new Date().toLocaleTimeString()} [${prefix}]: `;
  }

  return {
    /** Connect Client */
    connect,
    /** Client */
    pgClient,
    /** Listen to a provided channel. */
    attachListener,
    /** Listen to all provided channels. */
    attachListenerAll,
    /** Notify when a provided channel receives a notification. */
    notifyListener,
    /** Utility to match a channel from provided channels. */
    matchChannel,
  };
}
