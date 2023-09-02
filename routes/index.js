import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';
import { basicAuth, tokenAuth } from '../middlewares/auth';

function mapRoutes(app) {
  app.get('/status', AppController.getStatus);
  app.get('/stats', AppController.getStats);
  app.post('/users', UsersController.postNew);
  app.get('/connect', [basicAuth], AuthController.getConnect);
  app.get('/disconnect', AuthController.getDisconnect);
  app.get('/users/me', [tokenAuth], AuthController.getMe);
  app.post('/files', [tokenAuth], FilesController.postUpload);
  app.get('/files/:id', [tokenAuth], FilesController.getShow);
  app.get('/files', [tokenAuth], FilesController.getIndex);
  app.put('/files/:id/publish', [tokenAuth], FilesController.putPublish);
  app.put('/files/:id/unpublish', [tokenAuth], FilesController.putUnpublish);
}

export default mapRoutes;
