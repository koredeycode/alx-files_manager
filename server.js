import express from 'express';
import mapRoutes from './routes/index';

const app = express();
app.use(express.json());

mapRoutes(app);

app.listen(5000, () => {
  console.log('Server is listening on port 5000');
});

export default app;
