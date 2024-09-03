/**
 * Simple server interface for storing server information.
 * @property ip - The IP address of the server.
 * @property port - The port of the server.
 */
export interface Server {
  ip: string;
  port: number;
}

/**
 * Message interface for messages stored in Redis.
 * @property id - The unique identifier for the message.
 * @property content - The content of the message.
 * @property timestamp - The timestamp when the message was created.
 */
export interface Message {
  id: string;
  content: string;
  timestamp: number;
}
