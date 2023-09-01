// import redisClient from '../utils/redis';
import dbClient from '../utils/db';
import { v4 as uuidv4 } from 'uuid';
import { makeDirectory, saveFileLocally } from '../utils/file';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const { name, type, parentId, isPublic, data } = req.body;
    const { user } = req.user;
    userId = user._id;
    if (!name) return res.status(400).send({ error: 'Missing name' });
    if (!type) return res.status(400).send({ error: 'Missing type' });
    if (!data && type != 'folder')
      return res.status(400).send({ error: 'Missing data' });
    if (parentId) {
      const folder = await dbClient.findFolder({ parentId });
      if (!folder) return res.status(400).send({ error: 'Parent not found' });
      if (folder.type != 'folder')
        return res.status(400).send({ error: 'Parent is not a folder' });
    }
    if (type === 'folder') {
      const newFolder = await dbClient.createFolder({
        userId,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || 0,
      });
      return res.status(201).send(newFolder);
    }
    const localPath = `${FOLDER_PATH}/${uuidv4()}`;
    // const buff = Buffer.from(data, 'base64');
    //store the file
    const newFile = await dbClient.createFile({
      userId,
      name,
      type,
      isPublic: isPublic || false,
      parentId: parentId || 0,
      localPath,
    });
  }
}

export default FilesController;
