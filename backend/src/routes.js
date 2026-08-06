import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { db } from './db.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretrainbowkey123';

// Configure Multer for File Uploads
const uploadsDir = path.resolve('public/uploads');
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

// Temporary in-memory OTP store (phone -> { otp, expires })
const otpStore = new Map();

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

// 1. Customer OTP Request
router.post('/auth/customer/send-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: 'Phone number is required' });

  // Generate a simple 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, { otp, expires: Date.now() + 5 * 60 * 1000 }); // 5 mins expiry

  console.log(`[OTP] Generated OTP for customer ${phone}: ${otp}`);

  // Return OTP in response in dev mode so the user/admin can test easily without real SMS
  res.json({ 
    message: 'OTP sent successfully (Simulated)', 
    otp: otp // Included for seamless frontend testing
  });
});

// 2. Customer OTP Login
router.post('/auth/customer/login', async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP are required' });

  const record = otpStore.get(phone);
  if (!record || record.expires < Date.now()) {
    return res.status(400).json({ message: 'OTP expired or not requested' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  // OTP verified, clear it
  otpStore.delete(phone);

  // Check or register customer
  let customer = await db.customers.findOne({ phone });
  if (!customer) {
    customer = await db.customers.create({ phone });
  }

  // Create JWT
  const token = jwt.sign({ phone, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });

  res.json({
    token,
    user: { phone, role: 'customer' }
  });
});

// 3. Admin Login
router.post('/auth/admin/login', async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@rainbow.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid Admin Email or Password' });
  }

  const token = jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });

  res.json({
    token,
    user: { email, role: 'admin' }
  });
});

/* ==========================================================================
   PRODUCTS ROUTES
   ========================================================================== */

// Get all products (with category filter)
router.get('/products', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const products = await db.products.find(filter);
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

// Add new product (Admin only)
router.post('/products', authenticateToken(['admin']), async (req, res) => {
  try {
    const { name, category, description, price, discount, images, video, colors, sizes } = req.body;
    
    const parsedColors = Array.isArray(colors) ? colors : (colors ? JSON.parse(colors) : []);
    const parsedSizes = Array.isArray(sizes) ? sizes : (sizes ? JSON.parse(sizes) : []);
    const parsedImages = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);

    const product = await db.products.create({
      name,
      category,
      description: description || `Beautiful ${name}`,
      price: Number(price),
      discount: Number(discount || 0),
      images: parsedImages,
      video: video || '',
      colors: parsedColors,
      sizes: parsedSizes
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Edit product (Admin only)
router.put('/products/:id', authenticateToken(['admin']), async (req, res) => {
  try {
    const { name, category, description, price, discount, images, video, colors, sizes } = req.body;
    
    const parsedColors = Array.isArray(colors) ? colors : (colors ? JSON.parse(colors) : []);
    const parsedSizes = Array.isArray(sizes) ? sizes : (sizes ? JSON.parse(sizes) : []);
    const parsedImages = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);

    const updated = await db.products.findByIdAndUpdate(req.params.id, {
      name,
      category,
      description,
      price: Number(price),
      discount: Number(discount || 0),
      images: parsedImages,
      video: video || '',
      colors: parsedColors,
      sizes: parsedSizes
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

// Get orders (Admins see all; Customers see only theirs by phone header/query)
router.get('/orders', authenticateToken(['admin', 'customer']), async (req, res) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await db.orders.find({});
    } else {
      orders = await db.orders.find({ phone: req.user.phone });
    }
    
    // Sort orders by date descending (manual sort since custom JSON db doesn't sort natively)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Place order (Customers or Guest)
router.post('/orders', async (req, res) => {
  try {
    const { name, phone, address, branch, paymentMethod, items, total } = req.body;
    if (!name || !phone || !address || !branch || !paymentMethod || !items || items.length === 0) {
      return res.status(400).json({ message: 'Missing order details' });
    }

    const order = await db.orders.create({
      name,
      phone,
      address,
      branch,
      paymentMethod,
      items,
      total: Number(total),
      status: 'Pending'
    });

    // Also register customer if not exists
    let customer = await db.customers.findOne({ phone });
    if (!customer) {
      await db.customers.create({ phone });
    }

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

  // 2. Seed Products
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
        sizes: ['2.2', '2.4', '2.6', '2.8']
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
        sizes: []
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
        sizes: []
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
        sizes: []
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
        sizes: []
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
        sizes: []
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
        sizes: []
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
        sizes: []
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
        sizes: []
      }
    ];
    for (const p of initialProducts) {
      await db.products.create(p);
    }
    console.log('Seeded initial products catalog.');
  }

  // 3. Seed an initial admin user record to customers if needed (admin is handle separately but nice to have customer record)
  const customerCount = await db.customers.countDocuments();
  if (customerCount === 0) {
    await db.customers.create({ phone: '9999999999' });
    console.log('Seeded initial customer.');
  }
};

export default router;
