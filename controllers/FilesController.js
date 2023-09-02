// import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { makeDirectory, saveFileLocally } from '../utils/file';
import * as dotenv from 'dotenv';

dotenv.config();

const FILETYPES = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};

class FilesController {
  static async postUpload(req, res) {
    const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    const { name, type, parentId, isPublic, data } = req.body;
    const { user } = req.user;
    console.log(user);
    const userId = user._id.toString();
    if (!name) return res.status(400).json({ error: 'Missing name' });
    if (!type) return res.status(400).json({ error: 'Missing type' });
    if (!data && type != 'folder')
      return res.status(400).json({ error: 'Missing data' });
    if (parentId) {
      const folder = await dbClient.findFolder({ _id: parentId });
      console.log(folder);
      if (!folder) return res.status(400).json({ error: 'Parent not found' });
      if (folder.type != 'folder')
        return res.status(400).json({ error: 'Parent is not a folder' });
    }
    if (type === 'folder') {
      const folderInfo = {
        userId,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || 0,
      };
      const { insertedId } = await dbClient.createFolder(folderInfo);
      delete folderInfo._id;
      return res.status(201).json({ id: insertedId, ...folderInfo });
    }
    if (type == 'file' || type == 'image') {
      makeDirectory(FOLDER_PATH);
      const localPath = await saveFileLocally(FOLDER_PATH, uuidv4(), data);
      const fileInfo = {
        userId,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || 0,
        localPath,
      };
      const { insertedId } = await dbClient.createFile(fileInfo);
      delete fileInfo._id;
      return res.status(201).json({ id: insertedId, ...fileInfo });
    }
  }
}

export default FilesController;
