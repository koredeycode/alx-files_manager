import { getUserFromAuthorization, getUserFromToken } from '../utils/auth';

export async function basicAuth(req, res, next) {
  const user = await getUserFromAuthorization(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = { user };
  next();
}

export async function tokenAuth(req, res, next) {
  const user = await getUserFromToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = { user };
  next();
}

export default {
  basicAuth,
  tokenAuth,
};
