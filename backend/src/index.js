import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import router, { seedDatabase } from './routes.js';

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

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
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

// Serve uploads folder statically
app.use('/uploads', express.static(path.resolve('public/uploads')));

// Serve other public assets if needed
app.use(express.static(path.resolve('public')));

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
