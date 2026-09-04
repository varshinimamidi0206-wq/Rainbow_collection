import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setDefaultResultOrder('ipv4first');

dotenv.config();

const useMongoDB = process.env.MONGODB_URI ? true : false;
const DATA_DIR = path.resolve('data');

// Make sure local data folder exists if using file storage fallback
if (!useMongoDB) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Custom simple JSON-file Database wrapper
class LocalCollection {
  constructor(name) {
    this.name = name;
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([], null, 2), 'utf-8');
    }
  }

  async _read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (e) {
      return [];
    }
  }

  async _write(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async find(query = {}) {
    const docs = await this._read();
    return docs.filter(doc => {
      for (const key in query) {
        if (query[key] !== undefined && doc[key] !== query[key]) {
          return false;
        }
      }
      return true;
    }).map(doc => ({ ...doc, id: doc._id }));
  }

  async findOne(query = {}) {
    const docs = await this.find(query);
    return docs.length > 0 ? docs[0] : null;
  }

  async findById(id) {
    return this.findOne({ _id: id });
  }

  async create(data) {
    const docs = await this._read();
    const newDoc = {
      _id: Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      createdAt: new Date().toISOString(),
      ...data
    };
    newDoc.id = newDoc._id;
    docs.push(newDoc);
    await this._write(docs);
    return newDoc;
  }

  async findByIdAndUpdate(id, updateData, options = {}) {
    const docs = await this._read();
    const index = docs.findIndex(doc => doc._id === id);
    if (index === -1) return null;

    docs[index] = {
      ...docs[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    docs[index].id = docs[index]._id;
    await this._write(docs);
    return docs[index];
  }

  async findByIdAndDelete(id) {
    const docs = await this._read();
    const docToDelete = docs.find(doc => doc._id === id);
    const filtered = docs.filter(doc => doc._id !== id);
    await this._write(filtered);
    return docToDelete || null;
  }

  async countDocuments(query = {}) {
    const docs = await this.find(query);
    return docs.length;
  }
}

// Define Mongo Schema and Models if using MongoDB
let db = {};

if (useMongoDB) {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully.');

    const CollectionSchema = new mongoose.Schema({
      name: String,
      image: String,
      description: String,
      displayOrder: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    });

    const ProductSchema = new mongoose.Schema({
      name: String,
      code: { type: String, unique: true },
      category: String,
      description: String,
      price: Number,
      discount: Number,
      images: [String],
      video: String,
      colors: [String],
      sizes: [String],
      collectionId: String,
      stock: { type: Boolean, default: true },
      isNewArrival: { type: Boolean, default: false },
      isActive: { type: Boolean, default: true },
      createdAt: { type: Date, default: Date.now }
    });

    const OrderSchema = new mongoose.Schema({
      name: String,
      phone: String,
      email: String,
      address: String,
      branch: String,
      paymentMethod: String,
      items: [
        {
          productId: String,
          name: String,
          price: Number,
          image: String,
          color: String,
          size: String
        }
      ],
      total: Number,
      status: { type: String, default: 'Pending' },
      createdAt: { type: Date, default: Date.now }
    });

    const CustomerSchema = new mongoose.Schema({
      email: { type: String, unique: true },
      password: { type: String }, // hashed password (optional for Google OAuth users)
      name: String,
      role: { type: String, default: 'customer' },
      picture: String,
      googleId: { type: String, sparse: true },
      isGoogleUser: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now }
    });

    const BannerSchema = new mongoose.Schema({
      url: String,
      title: String,
      createdAt: { type: Date, default: Date.now }
    });

    db.collections = mongoose.model('Collection', CollectionSchema);
    db.products = mongoose.model('Product', ProductSchema);
    db.orders = mongoose.model('Order', OrderSchema);
    db.customers = mongoose.model('Customer', CustomerSchema);
    db.banners = mongoose.model('Banner', BannerSchema);
  } catch (error) {
    console.error('MongoDB connection failed, falling back to local JSON files:', error.message);
    initLocalDB();
  }
} else {
  console.log('No MONGODB_URI found, using local JSON file database fallback.');
  initLocalDB();
}

function initLocalDB() {
  db.collections = new LocalCollection('collections');
  db.products = new LocalCollection('products');
  db.orders = new LocalCollection('orders');
  db.customers = new LocalCollection('customers');
  db.banners = new LocalCollection('banners');
}

export { db };
