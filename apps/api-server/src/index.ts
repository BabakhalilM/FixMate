// apps/api-server/src/index.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/auth.routes';
import connectDB from './config/db';
import reviewrouter from './routes/reviewRoutes';
import repairrouter from './routes/repair.route';
import userRouter from './routes/user.route';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

app.use(cors({ origin: 'https://landing-website-orpin.vercel.app', }));

// app.use(express.json());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/auth', router);
app.use('/api/reviews', reviewrouter);
app.use('/api/repairs',repairrouter);
app.use('/api/users', userRouter);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// THIS IS THE IMPORTANT LINE
app.use('/uploads', express.static(uploadDir));

// Simple route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.listen(port, "0.0.0.0", async () => {
  try {
    console.log('Connecting to the database...');
    await connectDB();
    console.log(`🚀 API Server running on http://localhost:${port}`);
  }catch(error){
    console.error('Error starting the server:', error);
  }
});