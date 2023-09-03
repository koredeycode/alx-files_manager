/* eslint-disable import/no-named-as-default */
/* eslint-disable object-curly-newline */
/* eslint-disable prefer-const */
// import redisClient from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import { makeDirectory, saveFileLocally } from '../utils/file';
import envLoader from '../utils/env_loader';

envLoader();

const FILETYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};
const NULL_ID = Buffer.alloc(24, '0').toString('utf-8');

class FilesController {
  static async postUpload(req, res) {
    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    const { name, type, parentId, isPublic, data } = req.body;
    const { user } = req.user;
    const userId = user._id.toString();
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type || !Object.values(FILETYPES).includes(type))
      return res.status(400).json({ error: 'Missing type' });
    if (!data && type !== 'folder') {
      return res.status(400).json({ error: 'Missing data' });
    }
    if (parentId) {
      const folder = await dbClient.findFolder({ _id: parentId });
      console.log(folder);
      if (!folder) return res.status(400).json({ error: 'Parent not found' });
      if (folder.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }
    if (type === 'folder') {
      const folderInfo = {
        userId,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || '0',
      };
      const { insertedId } = await dbClient.createFolder(folderInfo);
      delete folderInfo._id;
      if (folderInfo.parentId === '0') {
        folderInfo.parentId = 0;
      }
      return res.status(201).json({ id: insertedId, ...folderInfo });
    }
    if (type !== 'file' && type !== 'image') {
      return res.status(400).json({ error: 'Incorrect file type' });
    }
    makeDirectory(FOLDER_PATH);
    const localPath = await saveFileLocally(FOLDER_PATH, uuidv4(), data);
    const fileInfo = {
      userId,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || '0',
      localPath,
    };
    const { insertedId } = await dbClient.createFile(fileInfo);
    delete fileInfo._id;
    delete fileInfo.localPath;
    if (fileInfo.parentId === '0') {
      fileInfo.parentId = 0;
    }
    return res.status(201).json({ id: insertedId, ...fileInfo });
  }

  static async getShow(req, res) {
    const { id } = req.params;
    const { user } = req.user;
    const userId = user._id.toString();
    const file = await dbClient.findFile({ _id: id, userId });
    console.log(file);
    if (!file) return res.status(404).json({ error: 'Not found' });
    return res.json(file);
  }

  static async getIndex(req, res) {
    let { parentId, page } = req.query;
    parentId = parentId || 0;
    const { user } = req.user;
    const userId = user._id.toString();

    const pageSize = 20;
    const pageNumber = Number(page) || 0;
    const skip = pageSize * pageNumber;

    const pipeline = [
      { $match: { userId, parentId } },
      { $skip: skip },
      { $limit: pageSize },
    ];

    const query = { userId };
    if (parentId) query.parentId = parentId;
    const files = await dbClient.findFiles(pipeline);
    return res.json(files);
  }

  static async putPublish(req, res) {
    const { id } = req.params;
    const { user } = req.user;
    const userId = user._id.toString();
    const file = await dbClient.findFile({ _id: id, userId });
    if (!file) return res.status(404).json({ error: 'Not found' });
    await dbClient.updateFile(id, { isPublic: true });
    return res.json({ id, name: file.name, type: file.type, isPublic: true });
  }

  static async putUnpublish(req, res) {
    const { id } = req.params;
    const { user } = req.user;
    const userId = user._id.toString();
    const file = await dbClient.findFile({ _id: id, userId });
    if (!file) return res.status(404).json({ error: 'Not found' });
    await dbClient.updateFile(id, { isPublic: false });
    return res.json({ id, name: file.name, type: file.type, isPublic: false });
  }
}

export default FilesController;
