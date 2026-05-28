import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import connectDB from './config/db';
import { getRedisClient } from './config/redis';
import { getGenerationQueue } from './queues/generationQueue';
import { wsManager } from './websocket/wsManager';
import assignmentRoutes from './routes/assignmentRoutes';
import { errorHandler, notFound } from './middleware/errorHandler';

const PORT = parseInt(process.env.PORT || '5000', 10);

const bootstrap = async () => {
  await connectDB();

  try {
    const redis = getRedisClient();
    await redis.ping();
    console.log('✅ Redis ping successful');

    getGenerationQueue();
  } catch (redisErr) {
    console.warn('⚠️  Redis unavailable — caching & job queue disabled.');
    console.warn('   Error:', (redisErr as Error).message);
    console.warn('   Check REDIS_HOST / REDIS_PORT / REDIS_PASSWORD in .env\n');
  }

  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use(express.static(path.join(__dirname, '../public/frontend/.next/static')));
  app.use(express.static(path.join(__dirname, '../public/frontend/public')));

  app.get('/health', async (_req, res) => {
    let redisStatus = 'unknown';
    try {
      await getRedisClient().ping();
      redisStatus = 'connected';
    } catch {
      redisStatus = 'unavailable';
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'VedaAI Backend',
      redis: redisStatus,
    });
  });

  app.use('/api/assignments', assignmentRoutes);

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/frontend/.next/server/pages/_document.html'), 
      (err) => {
        if (err) {
          res.status(404).json({ message: 'Frontend asset not found' });
        }
      }
    );
  });

  app.use(notFound);
  app.use(errorHandler);

  const server = http.createServer(app);

  const wss = new WebSocketServer({ server, path: '/ws' });
  wsManager.init(wss);

  server.listen(PORT, () => {
    console.log(`\n🚀 VedaAI Backend running at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server at ws://localhost:${PORT}/ws`);
    console.log(`📋 Health check: http://localhost:${PORT}/health\n`);
  });

  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Shutting down...`);
    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
  });
};

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
