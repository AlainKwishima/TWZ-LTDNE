import amqp, { Channel } from 'amqplib';
import { EventType } from '../constants/index.js';
import { DomainEvent } from '../types/index.js';

const EXCHANGE_NAME = 'fems.events';

type EventHandler = (event: DomainEvent) => Promise<void>;
type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;

export class EventBus {
  private connection: AmqpConnection | null = null;
  private channel: Channel | null = null;
  private handlers: Map<EventType, EventHandler[]> = new Map();
  private url: string;
  private serviceName: string;

  constructor(url: string, serviceName: string) {
    this.url = url;
    this.serviceName = serviceName;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
      console.log(`[EventBus:${this.serviceName}] Connected to RabbitMQ`);
    } catch (error) {
      console.warn(`[EventBus:${this.serviceName}] RabbitMQ unavailable, events will be logged only:`, (error as Error).message);
    }
  }

  async publish<T>(type: EventType, payload: T): Promise<void> {
    const event: DomainEvent<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      source: this.serviceName,
    };

    if (!this.channel) {
      console.log(`[EventBus:${this.serviceName}] Event (offline):`, type, JSON.stringify(payload));
      return;
    }

    this.channel.publish(
      EXCHANGE_NAME,
      type,
      Buffer.from(JSON.stringify(event)),
      { persistent: true, contentType: 'application/json' }
    );
  }

  on(type: EventType, handler: EventHandler): void {
    const existing = this.handlers.get(type) || [];
    existing.push(handler);
    this.handlers.set(type, existing);
  }

  async subscribe(types: EventType[]): Promise<void> {
    if (!this.channel) return;

    const queue = await this.channel.assertQueue(`${this.serviceName}.queue`, { durable: true });

    for (const type of types) {
      await this.channel.bindQueue(queue.queue, EXCHANGE_NAME, type);
    }

    await this.channel.consume(queue.queue, async (msg) => {
      if (!msg) return;
      try {
        const event = JSON.parse(msg.content.toString()) as DomainEvent;
        const handlers = this.handlers.get(event.type) || [];
        for (const handler of handlers) {
          await handler(event);
        }
        this.channel?.ack(msg);
      } catch (error) {
        console.error(`[EventBus:${this.serviceName}] Error processing event:`, error);
        this.channel?.nack(msg, false, false);
      }
    });

    console.log(`[EventBus:${this.serviceName}] Subscribed to:`, types.join(', '));
  }

  async close(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }
}

export { EXCHANGE_NAME };
