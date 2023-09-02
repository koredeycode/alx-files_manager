import express from 'express';
import mapRoutes from './routes/index';
import envLoader from './utils/env_loader';

const app = express();
app.use(express.json());

mapRoutes(app);

envLoader();
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

export default app;
