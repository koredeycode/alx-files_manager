import { createClient } from 'redis';
import { promisify } from 'util';

const cli = createClient();

class RedisClient {
  constructor() {
    this.client = createClient();
    this.isClientConnected = true;
    this.client.on('error', (err) => {
      console.log(err);
      this.isClientConnected = false;
    });
    this.client.on('connect', () => {
      console.log('Redis client connected to the server');
      this.isClientConnected = true;
    });
  }

  isAlive() {
    return this.isClientConnected;
  }

  async set(key, value, duration) {
    await promisify(this.client.setex).bind(this.client)(key, duration, value);
  }

  async get(key) {
    return await promisify(this.client.get).bind(this.client)(key);
  }

  async del(key) {
    await promisify(this.client.del).bind(this.client)(key);
  }
}
const redisClient = new RedisClient();
export default redisClient;
