/* eslint-disable operator-linebreak */
/* eslint-disable no-nested-ternary */
import sha1 from 'sha1';
import { MongoClient, ObjectId } from 'mongodb';
import envLoader from './env_loader';

const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');

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

  async createFolder(_folderInfo) {
    const folderInfo = _folderInfo;
    if (folderInfo.parentId && folderInfo.parentId !== '0') {
      folderInfo.parentId = ObjectId(folderInfo.parentId);
    }
    if (folderInfo.userId) {
      folderInfo.userId = ObjectId(folderInfo.userId);
    }
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
    const file = await this.client.db().collection('files').findOne(query);
    return file;
  }

  async findFiles(userId, parentId, skip, pageSize) {
    const filters = { userId };
    console.log(parentId);

    // if (parentId !== undefined) {
    //   filters.parentId =
    //     !parentId && parentId !== ''
    //       ? parentId === '0'
    //         ? '0'
    //         : ObjectId(parentId)
    //       : ObjectId(NULL_ID);
    // }

    if (parentId !== undefined) {
      if (parentId === '' || parentId === '0') {
        filters.parentId = '0';
      } else {
        try {
          filters.parentId = ObjectId(parentId);
        } catch (error) {
          // Handle the case where ObjectId conversion fails (invalid parentId)
          // console.error('Invalid parentId:', parentId);
          filters.parentId = ObjectId(NULL_ID);
        }
      }
    }

    console.log(filters);

    const pipeline = [
      {
        $match: filters,
      },
      { $skip: skip },
      { $limit: pageSize },
      {
        $project: {
          _id: 0,
          id: '$_id',
          userId: '$userId',
          name: '$name',
          type: '$type',
          isPublic: '$isPublic',
          parentId: {
            $cond: {
              if: { $eq: ['$parentId', '0'] },
              then: 0,
              else: '$parentId',
            },
          },
        },
      },
    ];

    return this.client.db().collection('files').aggregate(pipeline).toArray();
  }

  async createFile(_fileInfo) {
    const fileInfo = _fileInfo;
    if (fileInfo.parentId && fileInfo.parentId !== '0') {
      fileInfo.parentId = ObjectId(fileInfo.parentId);
    }
    if (fileInfo.userId) {
      fileInfo.userId = ObjectId(fileInfo.userId);
    }
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
