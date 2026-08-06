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
app.use(cors({
  origin: '*', // Allows communication from Vite client
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
