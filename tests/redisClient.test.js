// Test file for redisClient.
// Test file for dbClient.
import { expect } from 'chai';
import sinon from 'sinon';
import { redisClient } from '../utils/redis';

describe('RedisClient Tests', () => {
  // Stub the promisified methods
  beforeEach(() => {
    sinon.stub(redisClient.client, 'setex');
    sinon.stub(redisClient.client, 'get');
    sinon.stub(redisClient.client, 'del');
  });

  // Restore the stubbed methods after each test
  afterEach(() => {
    sinon.restore();
  });

  it('should be alive when connected', () => {
    expect(redisClient.isAlive()).to.equal(true);
  });

  it('should set a key-value pair', async (done) => {
    const key = 'testKey';
    const value = 'testValue';
    const duration = 3600; // seconds

    await redisClient.set(key, value, duration);

    expect(redisClient.client.setex.calledOnce).to.equal(true);
    expect(redisClient.client.setex.calledWith(key, duration, value)).to.equal(
      true,
    );
    done();
  });

  it('should get a value by key', async () => {
    const key = 'testKey';
    const expectedValue = 'testValue';

    redisClient.client.get.resolves(expectedValue);

    const value = await redisClient.get(key);

    expect(redisClient.client.get.calledOnce).to.equal(true);
    expect(redisClient.client.get.calledWith(key)).to.equal(true);
    expect(value).to.equal(expectedValue);
  });

  it('should delete a key', async (done) => {
    const key = 'testKey';

    await redisClient.del(key);

    expect(redisClient.client.del.calledOnce).to.equal(true);
    expect(redisClient.client.del.calledWith(key)).to.equal(true);
    done();
  });
});
