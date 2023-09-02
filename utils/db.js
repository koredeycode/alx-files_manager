import * as dotenv from 'dotenv';
import sha1 from 'sha1';
import { MongoClient, ObjectId } from 'mongodb';

dotenv.config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}/${database}`;
    // const user = process.env.CLUSTER_USER;
    // const pwd = process.env.CLUSTER_PWD;
    // const url = `mongodb+srv://${user}:${pwd}@cluster0.l5awlge.mongodb.net/${database}`;

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
    if (user) throw Error('Already exists');
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

  async createFolder(_folderInfo) {
    return await this.client.db().collection('files').insertOne(folderInfo);
  }

  async findFolder(_query) {
    const query = _query;
    if (query._id) query._id = ObjectId(query._id);
    const folder = await this.client.db().collection('files').findOne(query);
    return folder;
  }

  // async findFilesOfFolder(folderId) {
  //   // continue;
  // }

  async createFile(fileInfo) {
    return await this.client.db().collection('files').insertOne(fileInfo);
  }
}

const dbClient = new DBClient();
export default dbClient;
