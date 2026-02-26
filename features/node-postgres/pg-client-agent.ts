import { Client as PgClient, Notification as PgNotification } from 'pg';

export function pgClientAgent(pgClient: PgClient) {
  async function connect() {
    try {
      await pgClient.connect();
      console.log(prefixLine('DB'), 'Connected');
    } catch (err) {
      console.error(prefixLine('DB'), 'Connection failed\n', err);
      throw new Error('Failed to connect database');
    }
    return pgClient;
  }

  function pgListener<const T extends string>(channels: T[]) {
    async function attachListener(channel: T) {
      try {
        await pgClient.query(`LISTEN ${channel}`);
        console.log(prefixLine('DB'), `Listening for ${channel}...`);
      } catch (e) {
        console.error(prefixLine('DB'), 'Listening failed\n', e);
        throw new Error('Failed to attach listener');
      }

      return pgClient;
    }

    function matchChannel(channel: PgNotification['channel']) {
      return channels.find((d) => d === channel) ?? null;
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

    return { attachListener, notifyListener, matchChannel };
  }

  function prefixLine(prefix: string) {
    return `${new Date().toLocaleTimeString()} [${prefix}]: `;
  }

  return {
    connect,
    pgListener,
    pgClient,
  };
}
