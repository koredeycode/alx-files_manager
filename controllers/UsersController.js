// import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) return res.status(400).json({ error: 'Missing email' });
    if (!password) return res.status(400).json({ error: 'Missing password' });
    try {
      const { insertedId } = await dbClient.createUser(email, password);
      return res.status(201).json({ email, id: insertedId });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
}

export default UsersController;
