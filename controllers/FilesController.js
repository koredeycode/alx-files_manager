/* eslint-disable import/no-named-as-default */
/* eslint-disable object-curly-newline */
/* eslint-disable prefer-const */
// import redisClient from '../utils/redis';
import Queue from 'bull';
import { contentType } from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import {
  makeDirectory,
  saveFileLocally,
  checkFile,
  getAbsFilePath,
} from '../utils/file';
import envLoader from '../utils/env_loader';
import { getUserFromToken } from '../utils/auth';

envLoader();

const FILETYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};

const fileQueue = new Queue('thumbnail generation');

class FilesController {
  static async postUpload(req, res) {
    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    const { name, type, parentId, isPublic, data } = req.body;
    const { user } = req;
    const userId = user._id.toString();
    if (!name) {
      res.status(400).json({ error: 'Missing name' });
      return;
    }
    if (!type || !Object.values(FILETYPES).includes(type)) {
      res.status(400).json({ error: 'Missing type' });
      return;
    }
    if (!data && type !== 'folder') {
      res.status(400).json({ error: 'Missing data' });
      return;
    }
    if (parentId) {
      const folder = await dbClient.findFolder({ _id: parentId });
      if (!folder) {
        res.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (folder.type !== 'folder') {
        res.status(400).json({ error: 'Parent is not a folder' });
        return;
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
      res.status(201).json({ id: insertedId, ...folderInfo });
      return;
    }
    if (type !== 'file' && type !== 'image') {
      res.status(400).json({ error: 'Incorrect file type' });
      return;
    }
    makeDirectory(FOLDER_PATH);
    const localPath = await saveFileLocally(
      FOLDER_PATH,
      uuidv4(),
      Buffer.from(data, 'base64'),
    );
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
    if (type === 'image') {
      fileQueue.add({ fileId: insertedId, userId: user._id });
    }
    res.status(201).json({ id: insertedId, ...fileInfo });
  }

  static async getShow(req, res) {
    const { id } = req.params;
    const { user } = req;
    const userId = user._id;
    const file = await dbClient.findFile({ _id: id, userId });

    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    res.json({
      id,
      userId: userId.toString(),
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId === '0' ? 0 : file.parentId.toString(),
    });
  }

  static async getIndex(req, res) {
    let { parentId, page } = req.query;
    page = /\d+/.test((page || '').toString()) ? Number.parseInt(page, 10) : 0;
    const { user } = req;
    const userId = user._id;

    const pageSize = 20;
    const skip = pageSize * page;

    const files = await dbClient.findFiles(userId, parentId, skip, pageSize);
    res.json(files);
  }

  static async putPublish(req, res) {
    const { id } = req.params;
    const { user } = req;
    const userId = user._id;
    const file = await dbClient.findFile({ _id: id, userId });
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    await dbClient.updateFile(id, { isPublic: true });
    res.json({
      id,
      name: file.name,
      type: file.type,
      isPublic: true,
      userId: userId.toString(),
      parentId: file.parentId === '0' ? 0 : file.parentId.toString(),
    });
  }

  static async putUnpublish(req, res) {
    const { id } = req.params;
    const { user } = req;
    const userId = user._id;
    const file = await dbClient.findFile({ _id: id, userId });
    if (!file) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    await dbClient.updateFile(id, { isPublic: false });
    res.json({
      id,
      userId: userId.toString(),
      name: file.name,
      type: file.type,
      isPublic: false,
      parentId: file.parentId === '0' ? 0 : file.parentId.toString(),
    });
  }

  static async getFile(req, res) {
    const { id } = req.params;
    let { size } = req.query;
    const user = await getUserFromToken(req);
    const userId = user ? user._id.toString() : '';
    const file = await dbClient.findFile({ _id: id });
    if (!file || (!file.isPublic && file.userId.toString() !== userId)) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    if (file.type === 'folder') {
      res.status(400).json({ error: "A folder doesn't have content" });
      return;
    }
    let filePath = file.localPath;
    if (size) {
      filePath = `${file.localPath}_${size}`;
    }
    const isValid = await checkFile(filePath);
    if (!isValid) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    const absolutePath = await getAbsFilePath(filePath);
    res.setHeader(
      'Content-Type',
      contentType(file.name) || 'text/plain; charset=utf-8',
    );
    res.status(200).sendFile(absolutePath);
  }
}

export default FilesController;
