import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretrainbowkey123';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'varshinimamidi0206@gmail.com').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Configure Multer for File Uploads
const uploadsDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Auth setup

// Helper to generate unique product codes sequentially
const generateUniqueCode = async (category, tempCodes = []) => {
  const cat = (category || '').toLowerCase();
  let prefix = 'RC-PRD';
  if (cat.includes('bangle')) prefix = 'RC-BNG';
  else if (cat.includes('earring')) prefix = 'RC-EAR';
  else if (cat.includes('chain') || cat.includes('necklace') || cat.includes('choker') || cat.includes('haram')) prefix = 'RC-CHN';
  else if (cat.includes('german') || cat.includes('silver')) prefix = 'RC-GSL';
  else if (cat.includes('1 gm') || cat.includes('gold')) prefix = 'RC-1GM';
  else if (cat.includes('rental')) prefix = 'RC-RNT';
  else if (cat.includes('cosmetic')) prefix = 'RC-COS';
  else if (cat.includes('hair') || cat.includes('clip') || cat.includes('accessory')) prefix = 'RC-HAR';

  const allProducts = await db.products.find({});
  const existingCodes = new Set([
    ...allProducts.map(p => p.code).filter(Boolean),
    ...tempCodes
  ]);
  let num = 1;
  let code = `${prefix}-${String(num).padStart(3, '0')}`;
  while (existingCodes.has(code)) {
    num++;
    code = `${prefix}-${String(num).padStart(3, '0')}`;
  }
  return code;
};

// Helper to check authentication
export const authenticateToken = (roles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ message: 'Forbidden or expired token' });
      
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Unauthorized role' });
      }

      req.user = user;
      next();
    });
  };
};

/* ==========================================================================
   AUTHENTICATION ROUTES
   ========================================================================== */

// 1. Customer Registration
router.post('/auth/customer/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields (name, email, password) are required' });
    }
    const sanitizedEmail = email.toLowerCase().trim();
    
    const existingUser = await db.customers.findOne({ email: sanitizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const role = sanitizedEmail === ADMIN_EMAIL ? 'admin' : 'customer';

    const newUser = await db.customers.create({
      name,
      email: sanitizedEmail,
      password: hashedPassword,
      role
    });

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Customer/Admin Email Login
router.post('/auth/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const sanitizedEmail = email.toLowerCase().trim();

    const user = await db.customers.findOne({ email: sanitizedEmail });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'This email is registered using Google Sign-In. Please click Continue with Google.' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const role = sanitizedEmail === ADMIN_EMAIL ? 'admin' : (user.role || 'customer');

    const token = jwt.sign(
      { id: user._id, email: user.email, role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        role,
        picture: user.picture || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 3. Google Sign-In Login
router.post('/auth/google/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID Token is required' });
    }

    let email, name, picture;

    if (idToken === 'mock-google-token') {
      email = 'googlecustomer@rainbow.com';
      name = 'Google Customer';
      picture = '';
    } else {
      const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
      const verifyRes = await fetch(verifyUrl);
      if (!verifyRes.ok) {
        return res.status(400).json({ message: 'Invalid Google token' });
      }

      const payload = await verifyRes.json();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
      const { email_verified } = payload;

      if (!email_verified) {
        return res.status(400).json({ message: 'Google email is not verified' });
      }
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const role = sanitizedEmail === ADMIN_EMAIL ? 'admin' : 'customer';

    let user = await db.customers.findOne({ email: sanitizedEmail });
    if (!user) {
      user = await db.customers.create({
        email: sanitizedEmail,
        name: name || '',
        picture: picture || '',
        role
      });
    } else {
      await db.customers.findByIdAndUpdate(user._id, {
        name: name || user.name,
        picture: picture || user.picture,
        role
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        role,
        picture: user.picture || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Login
router.post('/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const sanitizedEmail = email.toLowerCase().trim();

    const user = await db.customers.findOne({ email: sanitizedEmail });
    if (!user || user.role !== 'admin') {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: 'admin', name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        role: 'admin',
        picture: user.picture || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Config variables endpoint
router.get('/config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || ''
  });
});

/* ==========================================================================
   COLLECTIONS ROUTES
   ========================================================================== */

// Get all collections
router.get('/collections', async (req, res) => {
  try {
    const { active } = req.query;
    let collections = await db.collections.find({});
    if (active === 'true') {
      collections = collections.filter(c => c.isActive !== false);
    }
    // Sort by displayOrder ascending
    collections.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
    res.json(collections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single collection
router.get('/collections/:id', async (req, res) => {
  try {
    const collection = await db.collections.findById(req.params.id);
    if (!collection) return res.status(404).json({ message: 'Collection not found' });
    res.json(collection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new collection (Admin only)
router.post('/collections', authenticateToken(['admin']), async (req, res) => {
  try {
    const { name, image, description, displayOrder, isActive } = req.body;
    if (!name) return res.status(400).json({ message: 'Collection name is required' });

    const collection = await db.collections.create({
      name,
      image: image || '',
      description: description || '',
      displayOrder: Number(displayOrder || 0),
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
    });
    res.status(201).json(collection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Edit collection (Admin only)
router.put('/collections/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const { name, image, description, displayOrder, isActive } = req.body;
    if (!name) return res.status(400).json({ message: 'Collection name is required' });

    const updated = await db.collections.findByIdAndUpdate(req.params.id, {
      name,
      image: image || '',
      description: description || '',
      displayOrder: Number(displayOrder || 0),
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
    });

    if (!updated) return res.status(404).json({ message: 'Collection not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete collection (Admin only)
router.delete('/collections/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const deleted = await db.collections.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Collection not found' });
    res.json({ message: 'Collection deleted successfully', deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ==========================================================================
   PRODUCTS ROUTES
   ========================================================================== */

// Get all products (with category, collectionId, isNewArrival, active filters)
router.get('/products', async (req, res) => {
  try {
    const { category, collectionId, isNewArrival, active } = req.query;
    
    // Retrieve base products
    let products = await db.products.find({});
    if (active === 'true') {
      products = products.filter(p => p.isActive !== false);
    }

    if (isNewArrival !== undefined) {
      const isNew = isNewArrival === 'true';
      products = products.filter(p => p.isNewArrival === isNew);
    }

    if (collectionId || category) {
      const colTarget = (collectionId || '').toString().toLowerCase().trim();
      const catTarget = (category || '').toString().toLowerCase().trim();

      // Look up all collections to match ID with name and vice versa
      const allCollections = await db.collections.find({});
      const matchedColl = allCollections.find(c => 
        (colTarget && c._id && c._id.toString().toLowerCase() === colTarget) ||
        (colTarget && c.id && c.id.toString().toLowerCase() === colTarget) ||
        (colTarget && c.name && c.name.toLowerCase() === colTarget) ||
        (catTarget && c._id && c._id.toString().toLowerCase() === catTarget) ||
        (catTarget && c.id && c.id.toString().toLowerCase() === catTarget) ||
        (catTarget && c.name && c.name.toLowerCase() === catTarget)
      );

      const targetId = matchedColl ? (matchedColl._id || matchedColl.id).toString().toLowerCase() : colTarget;
      const targetName = matchedColl ? matchedColl.name.toLowerCase() : catTarget;

      products = products.filter(p => {
        const prodColId = (p.collectionId || '').toString().toLowerCase();
        const prodCat = (p.category || '').toLowerCase();
        return (targetId && prodColId === targetId) || 
               (targetName && prodCat === targetName) ||
               (colTarget && prodColId === colTarget) ||
               (colTarget && prodCat === colTarget) ||
               (catTarget && prodColId === catTarget) ||
               (catTarget && prodCat === catTarget);
      });
    }

    // Sort products by date descending (newest first)
    products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/products/:id', async (req, res) => {
  try {
    const product = await db.products.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product by code
router.get('/products/code/:code', async (req, res) => {
  try {
    const product = await db.products.findOne({ code: req.params.code.trim().toUpperCase() });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new product (Admin only)
router.post('/products', authenticateToken(['admin']), async (req, res) => {
  try {
    const { 
      name, code, category, description, price, discount, images, video, colors, sizes, 
      collectionId, stock, isNewArrival, isActive 
    } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Unique Product Code is required' });
    }
    const normalizedCode = code.trim().toUpperCase();
    const existingProduct = await db.products.findOne({ code: normalizedCode });
    if (existingProduct) {
      return res.status(400).json({ message: 'This code is already used.' });
    }

    const parsedColors = Array.isArray(colors) ? colors : (colors ? JSON.parse(colors) : []);
    const parsedSizes = Array.isArray(sizes) ? sizes : (sizes ? JSON.parse(sizes) : []);
    const parsedImages = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);

    // Resolve category name from collectionId for backward compatibility
    let resolvedCategory = category || 'Bangles';
    if (collectionId) {
      const coll = await db.collections.findById(collectionId);
      if (coll) {
        resolvedCategory = coll.name;
      }
    }

    const product = await db.products.create({
      name,
      code: normalizedCode,
      category: resolvedCategory,
      description: description || `Beautiful ${name}`,
      price: Number(price),
      discount: Number(discount || 0),
      images: parsedImages,
      video: video || '',
      colors: parsedColors,
      sizes: parsedSizes,
      collectionId: collectionId || '',
      stock: stock !== undefined ? (stock === 'true' || stock === true) : true,
      isNewArrival: isNewArrival !== undefined ? (isNewArrival === 'true' || isNewArrival === true) : false,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Edit product (Admin only)
router.put('/products/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const { 
      name, code, category, description, price, discount, images, video, colors, sizes, 
      collectionId, stock, isNewArrival, isActive 
    } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Unique Product Code is required' });
    }
    const normalizedCode = code.trim().toUpperCase();
    const existingProduct = await db.products.findOne({ code: normalizedCode });
    if (existingProduct && existingProduct._id.toString() !== req.params.id.toString()) {
      return res.status(400).json({ message: 'This code is already used.' });
    }

    const parsedColors = Array.isArray(colors) ? colors : (colors ? JSON.parse(colors) : []);
    const parsedSizes = Array.isArray(sizes) ? sizes : (sizes ? JSON.parse(sizes) : []);
    const parsedImages = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);

    // Resolve category name from collectionId for backward compatibility
    let resolvedCategory = category;
    if (collectionId) {
      const coll = await db.collections.findById(collectionId);
      if (coll) {
        resolvedCategory = coll.name;
      }
    }

    const updated = await db.products.findByIdAndUpdate(req.params.id, {
      name,
      code: normalizedCode,
      category: resolvedCategory,
      description,
      price: Number(price),
      discount: Number(discount || 0),
      images: parsedImages,
      video: video || '',
      colors: parsedColors,
      sizes: parsedSizes,
      collectionId: collectionId || '',
      stock: stock !== undefined ? (stock === 'true' || stock === true) : true,
      isNewArrival: isNewArrival !== undefined ? (isNewArrival === 'true' || isNewArrival === true) : false,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : true
    });

    if (!updated) return res.status(404).json({ message: 'Product not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product (Admin only)
router.delete('/products/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const deleted = await db.products.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully', deleted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ==========================================================================
   ORDERS ROUTES
   ========================================================================== */

// Get orders (Admins see all; Customers see only theirs by email)
router.get('/orders', authenticateToken(['admin', 'customer']), async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await db.orders.find({});
    } else {
      orders = await db.orders.find({ email: req.user.email });
    }
    
    // Sort orders by date descending
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Place order (Customers or Guest)
router.post('/orders', async (req, res) => {
  try {
    const { name, phone, email, address, branch, paymentMethod, items, total } = req.body;
    if (!name || !phone || !address || !branch || !paymentMethod || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing order details' });
    }

    const order = await db.orders.create({
      name,
      phone,
      email: email || '',
      address,
      branch,
      paymentMethod,
      items,
      total: Number(total),
      status: 'Pending'
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update order status (Admin only)
router.put('/orders/:id/status', authenticateToken(['admin']), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Confirmed', 'Delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await db.orders.findByIdAndUpdate(req.params.id, { status });
    if (!updated) return res.status(404).json({ message: 'Order not found' });
    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

/* ==========================================================================
   BANNERS ROUTES
   ========================================================================== */

router.get('/banners', async (req, res) => {
  try {
    const banners = await db.banners.find({});
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/banners', authenticateToken(['admin']), async (req, res) => {
  try {
    const { url, title } = req.body;
    if (!url) return res.status(400).json({ message: 'Banner url is required' });
    const banner = await db.banners.create({ url, title: title || '' });
    res.status(201).json(banner);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/banners/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const deleted = await db.banners.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Banner not found' });
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ==========================================================================
   FILE UPLOAD ROUTE
   ========================================================================== */

// Route to upload up to 3 files or a single video
router.post('/upload', upload.array('files', 3), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const fileUrls = [];
    
    for (const file of req.files) {
      if (isCloudinaryConfigured) {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: 'auto',
          folder: 'rainbow_jewellers'
        });
        fileUrls.push(result.secure_url);
        // Delete local temporary file
        fs.unlinkSync(file.path);
      } else {
        // Serve local static file
        // Construct backend file URL: /uploads/filename
        fileUrls.push(`/uploads/${file.filename}`);
      }
    }

    res.json({ urls: fileUrls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/* ==========================================================================
   SEED INITIAL DATA
   ========================================================================== */

export const seedDatabase = async () => {
  // 1. Seed Banners
  const bannerCount = await db.banners.countDocuments();
  if (bannerCount === 0) {
    const initialBanners = [
      { url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1000', title: 'New Arrivals' },
      { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000', title: 'Weekly Stock' },
      { url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=1000', title: 'Festival Collection' },
      { url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1000', title: 'Wedding Collection' }
    ];
    for (const b of initialBanners) {
      await db.banners.create(b);
    }
    console.log('Seeded initial homepage banners.');
  }

  // 2. Seed Collections if empty
  const collectionCount = await db.collections.countDocuments();
  if (collectionCount === 0) {
    const initialCollections = [
      { name: 'Bangles', image: '💍', displayOrder: 1 },
      { name: 'Earrings', image: '👂', displayOrder: 2 },
      { name: 'Short Chains', image: '📿', displayOrder: 3 },
      { name: 'Long Chains', image: '✨', displayOrder: 4 },
      { name: 'Cosmetics', image: '💄', displayOrder: 5 },
      { name: 'Hair Accessories', image: '🎀', displayOrder: 6 },
      { name: 'German Silver', image: '🪙', displayOrder: 7 },
      { name: '1 GM Jewellery', image: '💎', displayOrder: 8 },
      { name: 'Rental Jewellery', image: '👑', displayOrder: 9 }
    ];
    for (const c of initialCollections) {
      await db.collections.create({
        name: c.name,
        image: c.image,
        description: `Premium collection of ${c.name}`,
        displayOrder: c.displayOrder,
        isActive: true
      });
    }
    console.log('Seeded initial collections.');
  }

  // Fetch collections to map categories
  const allCollections = await db.collections.find({});

  // 3. Seed Products if empty
  const productCount = await db.products.countDocuments();
  if (productCount === 0) {
    const initialProducts = [
      {
        name: 'Gold Plated Bangles',
        category: 'Bangles',
        description: 'Beautiful Daily Wear Bangles',
        price: 799,
        discount: 20,
        images: [
          'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500',
          'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'
        ],
        video: '',
        colors: ['Gold', 'Rose Gold', 'Silver'],
        sizes: ['2.2', '2.4', '2.6', '2.8'],
        isNewArrival: true,
        stock: true,
        isActive: true
      },
      {
        name: 'Traditional Jhumkas',
        category: 'Earrings',
        description: 'Beautiful Daily Wear Earrings',
        price: 399,
        discount: 15,
        images: ['https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500'],
        video: '',
        colors: ['Gold', 'Silver'],
        sizes: [],
        isNewArrival: true,
        stock: true,
        isActive: true
      },
      {
        name: 'Short Choker Chain',
        category: 'Short Chains',
        description: 'Elegant Party Wear Chain',
        price: 999,
        discount: 10,
        images: ['https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500'],
        video: '',
        colors: ['Gold'],
        sizes: [],
        isNewArrival: true,
        stock: true,
        isActive: true
      },
      {
        name: 'Designer Haram Set',
        category: 'Long Chains',
        description: 'Traditional Bangles Necklace Combo',
        price: 1599,
        discount: 25,
        images: ['https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=500'],
        video: '',
        colors: ['Gold'],
        sizes: [],
        isNewArrival: false,
        stock: true,
        isActive: true
      },
      {
        name: 'Velvet Hair Bow Clip',
        category: 'Hair Accessories',
        description: 'Stylish Hair Clip',
        price: 149,
        discount: 5,
        images: ['https://images.unsplash.com/photo-1606156137806-d345a4e037f3?w=500'],
        video: '',
        colors: ['Red', 'Pink', 'Green'],
        sizes: [],
        isNewArrival: false,
        stock: true,
        isActive: true
      },
      {
        name: 'Matte Liquid Lipstick',
        category: 'Cosmetics',
        description: 'Premium Long Lasting Lipstick',
        price: 299,
        discount: 10,
        images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500'],
        video: '',
        colors: ['Red', 'Pink'],
        sizes: [],
        isNewArrival: false,
        stock: true,
        isActive: true
      },
      {
        name: 'German Silver Oxidised Set',
        category: 'German Silver',
        description: 'Premium German Silver Set',
        price: 1299,
        discount: 15,
        images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500'],
        video: '',
        colors: ['Silver'],
        sizes: [],
        isNewArrival: false,
        stock: true,
        isActive: true
      },
      {
        name: '1 GM Gold Plated Necklace',
        category: '1 GM Jewellery',
        description: 'Designer Necklace',
        price: 1899,
        discount: 30,
        images: ['https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500'],
        video: '',
        colors: ['Gold'],
        sizes: [],
        isNewArrival: false,
        stock: true,
        isActive: true
      },
      {
        name: 'Heavy Bridal Haram Rental',
        category: 'Rental Jewellery',
        description: 'Traditional Wedding Rental jewellery set',
        price: 2500,
        discount: 0,
        images: ['https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=500'],
        video: '',
        colors: ['Gold'],
        sizes: [],
        isNewArrival: false,
        stock: true,
        isActive: true
      }
    ];
    const tempCodes = [];
    for (const p of initialProducts) {
      const match = allCollections.find(c => c.name.toLowerCase() === (p.category || '').toLowerCase());
      const code = await generateUniqueCode(p.category, tempCodes);
      tempCodes.push(code);
      await db.products.create({
        ...p,
        code,
        collectionId: match ? match._id : ''
      });
    }
    console.log('Seeded initial products catalog with collections.');
  }

  // 4. Migrate / link any products that do not have collectionId, isNewArrival, isActive, stock, or code set
  const allProducts = await db.products.find({});
  const migrationTempCodes = [];
  for (const p of allProducts) {
    let needsUpdate = false;
    const updateData = {};

    if (!p.code) {
      const code = await generateUniqueCode(p.category, migrationTempCodes);
      updateData.code = code;
      migrationTempCodes.push(code);
      needsUpdate = true;
    } else {
      migrationTempCodes.push(p.code);
    }
    if (!p.collectionId) {
      const match = allCollections.find(c => c.name.toLowerCase() === (p.category || '').toLowerCase());
      if (match) {
        updateData.collectionId = match._id;
        needsUpdate = true;
      }
    }
    if (p.isNewArrival === undefined) {
      updateData.isNewArrival = false;
      needsUpdate = true;
    }
    if (p.stock === undefined) {
      updateData.stock = true;
      needsUpdate = true;
    }
    if (p.isActive === undefined) {
      updateData.isActive = true;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await db.products.findByIdAndUpdate(p._id, updateData);
    }
  }

  // 5. Seed initial admin and test customer if db is empty
  const adminUser = await db.customers.findOne({ email: ADMIN_EMAIL });
  if (!adminUser) {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(ADMIN_PASSWORD, salt);
    await db.customers.create({
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin'
    });
    console.log('Seeded admin user.');
  }

  const testCustomer = await db.customers.findOne({ email: 'customer@rainbow.com' });
  if (!testCustomer) {
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash('password123', salt);
    await db.customers.create({
      name: 'Test Customer',
      email: 'customer@rainbow.com',
      password: hashedPassword,
      role: 'customer'
    });
    console.log('Seeded test customer user.');
  }

  // 6. Migrate existing orders to default customer email
  const allOrders = await db.orders.find({});
  for (const order of allOrders) {
    if (!order.email) {
      await db.orders.findByIdAndUpdate(order._id, {
        email: 'customer@rainbow.com'
      });
    }
  }
};

export default router;
