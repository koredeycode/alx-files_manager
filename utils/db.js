import sha1 from 'sha1';
import { MongoClient, ObjectId } from 'mongodb';
import envLoader from './env_loader';

class DBClient {
  constructor() {
    envLoader();
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const clusterUser = process.env.CLUSTER_USER;
    const clusterPwd = process.env.CLUSTER_PWD;
    let url;

    if (clusterUser && clusterPwd) {
      url = `mongodb+srv://${clusterUser}:${clusterPwd}@cluster0.l5awlge.mongodb.net/${database}`;
    } else {
      url = `mongodb://${host}:${port}/${database}`;
    }

    this.client = new MongoClient(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  async createUser(email, password) {
    const user = await this.client.db().collection('users').findOne({ email });
    if (user) throw Error('Already exist');
    const hashedPwd = sha1(password);
    return this.client
      .db()
      .collection('users')
      .insertOne({ email, password: hashedPwd });
  }

  async findUser(_query) {
    const query = _query;
    if (query._id) query._id = ObjectId(query._id);
    const user = await this.client.db().collection('users').findOne(query);
    return user;
  }

  async createFolder(folderInfo) {
    return this.client.db().collection('files').insertOne(folderInfo);
  }

  async findFolder(_query) {
    const query = _query;
    if (query._id) query._id = ObjectId(query._id);
    const folder = await this.client.db().collection('files').findOne(query);
    return folder;
  }

  async findFile(_query) {
    const query = _query;
    if (query._id) query._id = ObjectId(query._id);
    const file = await this.client
      .db()
      .collection('files')
      .findOne(query, { _id: 0, id: '$_id' });
    return file;
  }

  async findFiles(pipeline) {
    return this.client.db().collection('files').aggregate(pipeline).toArray();
  }

  async createFile(fileInfo) {
    return this.client.db().collection('files').insertOne(fileInfo);
  }

  async updateFile(id, update) {
    const newUpdate = { $set: update };
    const query = { _id: ObjectId(id) };
    const file = await this.client
      .db()
      .collection('files')
      .updateOne(query, newUpdate);
    return file;
  }
}

export const dbClient = new DBClient();
export default dbClient;
