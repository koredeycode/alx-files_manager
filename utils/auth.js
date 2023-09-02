import sha1 from 'sha1';
import dbClient from './db';
import redisClient from './redis';

export async function getUserFromAuthorization(req) {
  const authorization = req.headers.authorization || null;
  if (!authorization) return null;
  const authorizationParts = authorization.split(' ');
  if (authorizationParts.length !== 2 || authorizationParts[0] !== 'Basic') {
    return null;
  }
  const credential = Buffer.from(authorizationParts[1], 'base64').toString();
  const separator = credential.indexOf(':');
  const email = credential.substring(0, separator);
  const password = credential.substring(separator + 1);

  const user = await dbClient.findUser({ email });

  if (!user || sha1(password) !== user.password) return null;
  return user;
}

export async function getUserFromToken(req) {
  const token = req.headers['x-token'] || null;

  if (!token) return null;
  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) return null;
  const user = await dbClient.findUser({ _id: userId });
  if (!user) return null;
  return user;
}

export default {
  getUserFromAuthorization,
  getUserFromToken,
};
