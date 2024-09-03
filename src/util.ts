import { redis } from "./index.js";
import { Message, Server } from "./types.js";

/**
 * Synchronizes the servers with the provided list of servers.
 *
 * @param servers - The list of servers to synchronize.
 * @returns A promise that resolves to an object containing the synchronized servers.
 * @throws If there is an error while synchronizing the servers.
 */
export async function syncServers(
  servers: Server[],
): Promise<{ servers: Server[] }> {
  const serversSetKey = "servers";
  const response: Server[] = [];

  try {
    const myServerStrings = await redis.sMembers(serversSetKey);
    const myServers: Server[] = myServerStrings.map((str) => JSON.parse(str));

    for (const server of myServers) {
      if (!servers.some((s) => s.ip === server.ip && s.port === server.port)) {
        response.push(server);
      }
    }

    for (const server of servers) {
      if (
        !myServers.some((s) => s.ip === server.ip && s.port === server.port)
      ) {
        await redis.sAdd(serversSetKey, JSON.stringify(server));
      }
    }

    return { servers: response };
  } catch (error) {
    console.error("Error syncing servers:", error);
    throw error;
  }
}

/**
 * Synchronizes the hashes with the provided list of hashes.
 * @param hashes - The list of hashes to synchronize.
 * @returns A promise that resolves to an object containing the synchronized hashes.
 * @throws If there is an error while synchronizing the hashes.
 */
export async function syncHashes(
  hashes: string[],
): Promise<{ hashes: string[] }> {
  const response: string[] = [];

  try {
    const myHashes = await redis.keys("hash:*");

    for (const hash of myHashes) {
      const shortHash = hash.substring(5);
      if (!hashes.includes(shortHash)) {
        response.push(shortHash);
      }
    }

    return { hashes: response };
  } catch (error) {
    console.error("Error syncing hashes:", error);
    throw error;
  }
}

/**
 * Store a message in Redis.
 * @param message - The message to store.
 */
export function storeMessage(message) {
  const recipient = message.recipient;
  const hashKey = `hash:${message.hash}`;
  const messageStr = JSON.stringify(message);
  const recipientSetKey = `recipient:${recipient}`;
  const expiryTime = 7 * 24 * 60 * 60;
  redis.set(hashKey, messageStr);
  redis.sAdd(recipientSetKey, hashKey);
  redis.expire(hashKey, expiryTime);
  // TODO: remove items from the recipient set as they're expired. This expiry logic does not work and the set will infinitely grow.
  redis.expire(recipientSetKey, expiryTime);
}

/**
 * Search the messages in the Redis database by recipient.
 * @param recipient - The recipient to search by.
 * @returns A promise that resolves to an array of messages for the given recipient.
 */
export async function searchByRecipient(recipient: string): Promise<Message[]> {
  const recipientSetKey = `recipient:${recipient}`;

  try {
    const hashKeys = await redis.sMembers(recipientSetKey);
    const messages: Message[] = [];

    for (const hashKey of hashKeys) {
      const messageStr = await redis.get(hashKey);
      if (messageStr) {
        try {
          const message: Message = JSON.parse(messageStr);
          messages.push(message);
        } catch (parseError) {
          console.error(
            `Error parsing message for hashKey ${hashKey}:`,
            parseError,
          );
        }
      }
    }

    return messages;
  } catch (error) {
    console.error("Error searching by recipient:", error);
    throw error;
  }
}

/**
 * Search by hash
 * @param hash - The hash to search by
 * @returns A promise that resolves to the message with the given hash, or null if no message is found.
 */
export async function searchByHash(hash: string): Promise<Message | null> {
  const hashKey = `hash:${hash}`;

  try {
    const messageStr = await redis.get(hashKey);
    if (messageStr) {
      return JSON.parse(messageStr) as Message;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error searching by hash:", error);
    throw error;
  }
}
