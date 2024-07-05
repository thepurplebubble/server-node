import { redis } from "./index.js";

export function syncServers(servers) {
  const serversSetKey = "servers";
  const response = [];
  redis.sMembers(serversSetKey, (myServerStrings) => {
    let myServers = myServerStrings.map(JSON.parse);
    myServers.forEach((server) => {
      if (!servers.includes(server)) {
        response.push(server);
      }
    });
    servers.forEach((server) => {
      if (!myServers.includes(server)) {
        redis.sAdd(serversSetKey, server);
      }
    });
  });
  return { servers: response };
}

export function syncHashes(hashes) {
  const response = [];
  redis.keys("hash:*", (myHashes) => {
    myHashes.forEach((hash) => {
      if (!hashes.includes(hash)) {
        response.push(hash.substring(5));
      }
    });
  });
  return { hashes: response };
}

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

export function searchByRecipient(recipient) {
  const recipientSetKey = `recipient:${recipient}`;

  redis.sMembers(recipientSetKey, (hashKeys) => {
    const messages = [];
    hashKeys.forEach((hashKey) => {
      redis.get(hashKey, (messageStr) => {
        if (messageStr) messages.push(JSON.parse(messageStr));
      });
    });

    return messages;
  });
}

export function searchByHash(hash) {
  const hashKey = `hash:${hash}`;

  redis.get(`hash:${hashKey}`, (messageStr) => {
    if (messageStr) return JSON.parse(messageStr);
    else return null;
  });
}
