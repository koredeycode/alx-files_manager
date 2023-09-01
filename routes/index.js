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
}

export default mapRoutes;
