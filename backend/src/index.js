import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import router, { seedDatabase } from './routes.js';
import { db } from './db.js';

// Resolve __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Environment Variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
const allowedOrigins = [
  'https://rainbow-collection-4nlg.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL.trim());
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) || 
      origin.startsWith('http://localhost') || 
      origin.startsWith('http://127.0.0.1') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS not allowed'), false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploads folder statically using guaranteed absolute path
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
app.use('/api/uploads', express.static(uploadsDir));

// Self-healing image handler: if file is not on ephemeral disk, fetch from MongoDB & cache to disk
const serveOrRecoverImage = async (req, res, next) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadsDir, filename);

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    // Recover from MongoDB image store
    const imageDoc = await db.images.findOne({ filename });
    if (imageDoc && imageDoc.data) {
      const buffer = Buffer.from(imageDoc.data, 'base64');
      // Recreate disk cache
      try {
        fs.writeFileSync(filePath, buffer);
        console.log(`[Self-Healing] Restored missing file to disk cache: ${filename}`);
      } catch (writeErr) {
        console.warn(`[Self-Healing] Disk write warning: ${writeErr.message}`);
      }

      res.setHeader('Content-Type', imageDoc.mimeType || 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.send(buffer);
    }

    return res.status(404).json({ message: 'Image not found' });
  } catch (err) {
    console.error('[Image Serve Error]', err);
    next(err);
  }
};

app.get('/uploads/:filename', serveOrRecoverImage);
app.get('/api/uploads/:filename', serveOrRecoverImage);

// Serve other public assets if needed
app.use(express.static(path.join(__dirname, '../public')));

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Rainbow Jewellery Store Backend API is running.' });
});

// Register Routes
app.use('/api', router);

// Start server and seed database
app.listen(PORT, async () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  try {
    await seedDatabase();
    console.log('Database verification and seeding complete.');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  }
});
