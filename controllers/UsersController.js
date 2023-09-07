/* eslint-disable import/no-named-as-default */
// import redisClient from '../utils/redis';
import Queue from 'bull';
import dbClient from '../utils/db';

const userQueue = new Queue('email sending');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }
    const user = await dbClient.findUser({ email });
    if (user) {
      res.status(400).json({ error: 'Already exist' });
      return;
    }
    const { insertedId } = await dbClient.createUser(email, password);
    userQueue.add({ userId: insertedId });
    res.status(201).json({ email, id: insertedId });
  }

  static getMe(req, res) {
    const { user } = req;
    res.status(200).json({ id: user._id.toString(), email: user.email });
  }
}

export default UsersController;
