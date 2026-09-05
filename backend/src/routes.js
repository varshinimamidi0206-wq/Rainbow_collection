import express from 'express';
import jwt from 'jsonwebtoken';
import bcryptjs from 'bcryptjs';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretrainbowkey123';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'varshinimamidi0206@gmail.com').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || '';
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://rainbow-collection-4nlg.vercel.app').replace(/\/+$/, '');

const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL
);

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
    const rawCode = (req.body && req.body.productCode) || (req.query && req.query.productCode) || '';
    const cleanCode = rawCode.toString().replace(/[^a-zA-Z0-9_-]/g, '').trim();
    const prefix = cleanCode ? `${cleanCode}_` : 'prd_';
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${prefix}${uniqueSuffix}${ext}`);
  }
});
const upload = multer({ storage });

// Multer storage for collection cover images (Guaranteed unique storage key per Step 5)
const collectionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const colId = (req.params && req.params.id) || 'col';
    const rawName = (req.body && req.body.name) || 'collection';
    const cleanName = rawName.toString().replace(/[^a-zA-Z0-9_-]/g, '').trim() || 'collection';
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `collection-${cleanName}-${colId}-${uniqueSuffix}${ext}`);
  }
});
const collectionUpload = multer({ storage: collectionStorage });
const handleCollectionUpload = collectionUpload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'image', maxCount: 1 },
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 1 }
]);

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

// Helper to verify real Google ID tokens using google-auth-library with fallback
async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Google ID Token is required');
  }

  // Reject mock tokens immediately
  if (idToken === 'mock-google-token' || idToken.startsWith('mock-')) {
    throw new Error('Mock tokens are strictly disallowed. Please use real Google authentication.');
  }

  // 1. Primary verification using google-auth-library
  if (GOOGLE_CLIENT_ID) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new Error('Empty Google token payload');
      if (!payload.email) throw new Error('Google account email not found in token');
      if (!payload.email_verified) throw new Error('Google email address is not verified');

      return {
        sub: payload.sub,
        email: payload.email,
        name: payload.name || payload.given_name || 'Google User',
        picture: payload.picture || '',
        email_verified: payload.email_verified
      };
    } catch (err) {
      console.warn('googleClient.verifyIdToken notice:', err.message);
    }
  }

  // 2. Secondary verification via Google's official tokeninfo endpoint
  const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!verifyRes.ok) {
    const errData = await verifyRes.json().catch(() => ({}));
    throw new Error(errData.error_description || 'Invalid or expired Google token');
  }

  const payload = await verifyRes.json();
  if (GOOGLE_CLIENT_ID && payload.aud && payload.aud !== GOOGLE_CLIENT_ID) {
    throw new Error('Google token audience does not match configured Client ID');
  }
  if (!payload.email) {
    throw new Error('Google account email not found');
  }
  if (payload.email_verified === false || payload.email_verified === 'false') {
    throw new Error('Google email is not verified');
  }

  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name || 'Google User',
    picture: payload.picture || '',
    email_verified: true
  };
}

// 3. Real Google Sign-In (ID Token verification)
router.post('/auth/google/login', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'Google ID Token is required' });
    }

    const googleUser = await verifyGoogleIdToken(idToken);
    const sanitizedEmail = googleUser.email.toLowerCase().trim();

    // REQUIREMENT 11: Admin Portal must remain separate. Google login users are strictly customer role.
    const role = 'customer';

    let user = await db.customers.findOne({
      $or: [
        { email: sanitizedEmail },
        ...(googleUser.sub ? [{ googleId: googleUser.sub }] : [])
      ]
    });

    if (!user) {
      user = await db.customers.create({
        email: sanitizedEmail,
        name: googleUser.name || 'Customer',
        picture: googleUser.picture || '',
        googleId: googleUser.sub,
        isGoogleUser: true,
        role: 'customer'
      });
    } else {
      await db.customers.findByIdAndUpdate(user._id, {
        name: user.name || googleUser.name,
        picture: googleUser.picture || user.picture,
        googleId: googleUser.sub || user.googleId,
        isGoogleUser: true,
        // Preserve role if customer, never elevate to admin via Google
        role: user.role === 'admin' ? 'admin' : 'customer'
      });
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, role: user.role || 'customer', name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role || 'customer',
        picture: user.picture || googleUser.picture || ''
      }
    });
  } catch (error) {
    console.error('Google login verification failed:', error.message);
    res.status(400).json({ message: error.message || 'Google authentication failed' });
  }
});

// 4. Get Google OAuth2 Authorization URL (for full redirect flow)
router.get('/auth/google/url', (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(400).json({ 
      message: 'GOOGLE_CLIENT_ID is not configured in backend environment variables' 
    });
  }

  const callbackUrl = req.query.redirect_uri || GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account'
    }).toString();

  res.json({ url: authUrl });
});

// 5. Google OAuth2 Authorization Code Callback (for server-side redirect flow)
router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, error } = req.query;
    if (error) {
      return res.redirect(`${FRONTEND_URL}/#login?error=${encodeURIComponent(error)}`);
    }
    if (!code) {
      return res.redirect(`${FRONTEND_URL}/#login?error=No_code_provided`);
    }

    const callbackUrl = GOOGLE_CALLBACK_URL || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json().catch(() => ({}));
      return res.redirect(`${FRONTEND_URL}/#login?error=${encodeURIComponent(errData.error_description || 'Token_exchange_failed')}`);
    }

    const tokenData = await tokenRes.json();
    const googleUser = await verifyGoogleIdToken(tokenData.id_token);
    const sanitizedEmail = googleUser.email.toLowerCase().trim();

    let user = await db.customers.findOne({
      $or: [
        { email: sanitizedEmail },
        ...(googleUser.sub ? [{ googleId: googleUser.sub }] : [])
      ]
    });

    if (!user) {
      user = await db.customers.create({
        email: sanitizedEmail,
        name: googleUser.name || 'Customer',
        picture: googleUser.picture || '',
        googleId: googleUser.sub,
        isGoogleUser: true,
        role: 'customer'
      });
    } else {
      await db.customers.findByIdAndUpdate(user._id, {
        name: user.name || googleUser.name,
        picture: googleUser.picture || user.picture,
        googleId: googleUser.sub || user.googleId,
        isGoogleUser: true
      });
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, role: 'customer', name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userParam = encodeURIComponent(JSON.stringify({
      email: user.email,
      name: user.name,
      role: 'customer',
      picture: user.picture || googleUser.picture || ''
    }));

    res.redirect(`${FRONTEND_URL}/#login?token=${token}&user=${userParam}`);
  } catch (err) {
    console.error('OAuth callback failed:', err.message);
    res.redirect(`${FRONTEND_URL}/#login?error=${encodeURIComponent(err.message)}`);
  }
});

// 6. Google OAuth2 Authorization Code Exchange (for client-side code flow)
router.post('/auth/google/code', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code is required' });
    }

    const callbackUrl = redirectUri || GOOGLE_CALLBACK_URL || 'postmessage';
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code'
      }).toString()
    });

    if (!tokenRes.ok) {
      const errData = await tokenRes.json().catch(() => ({}));
      return res.status(400).json({ message: errData.error_description || 'Failed to exchange authorization code' });
    }

    const tokenData = await tokenRes.json();
    const googleUser = await verifyGoogleIdToken(tokenData.id_token);
    const sanitizedEmail = googleUser.email.toLowerCase().trim();

    let user = await db.customers.findOne({
      $or: [
        { email: sanitizedEmail },
        ...(googleUser.sub ? [{ googleId: googleUser.sub }] : [])
      ]
    });

    if (!user) {
      user = await db.customers.create({
        email: sanitizedEmail,
        name: googleUser.name || 'Customer',
        picture: googleUser.picture || '',
        googleId: googleUser.sub,
        isGoogleUser: true,
        role: 'customer'
      });
    } else {
      await db.customers.findByIdAndUpdate(user._id, {
        name: user.name || googleUser.name,
        picture: googleUser.picture || user.picture,
        googleId: googleUser.sub || user.googleId,
        isGoogleUser: true
      });
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, role: 'customer', name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        email: user.email,
        name: user.name,
        role: 'customer',
        picture: user.picture || googleUser.picture || ''
      }
    });
  } catch (err) {
    res.status(400).json({ message: err.message || 'Google code verification failed' });
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
    // Ensure browsers do not cache collection data to avoid stale cover images (Step 8/9)
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
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

// Add new collection (Admin only - supports multipart file upload & JSON)
router.post('/collections', authenticateToken(['admin']), handleCollectionUpload, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Collection name is required' });

    // Step 4 & 7: Check if a new file was uploaded
    const uploadedFile = (req.files && (
      req.files['coverImage']?.[0] || 
      req.files['image']?.[0] || 
      req.files['file']?.[0] || 
      req.files['files']?.[0]
    )) || req.file;

    let finalImage = '';

    if (uploadedFile) {
      console.log(`[Collection Create] Received cover image file: "${uploadedFile.originalname}" (${uploadedFile.size} bytes) -> stored as "${uploadedFile.filename}"`);
      if (isCloudinaryConfigured) {
        const result = await cloudinary.uploader.upload(uploadedFile.path, {
          resource_type: 'auto',
          folder: 'rainbow_jewellers/collections'
        });
        finalImage = result.secure_url;
        try { fs.unlinkSync(uploadedFile.path); } catch (e) {}
      } else {
        try {
          const fileBuffer = fs.readFileSync(uploadedFile.path);
          await db.images.create({
            filename: uploadedFile.filename,
            originalName: uploadedFile.originalname,
            mimeType: uploadedFile.mimetype || 'image/jpeg',
            data: fileBuffer.toString('base64'),
            size: uploadedFile.size
          });
        } catch (dbErr) {
          console.error('[Collection Create] Warning: Failed to persist to db.images:', dbErr.message);
        }
        finalImage = `/uploads/${uploadedFile.filename}`;
      }
    } else {
      finalImage = (req.body.coverImage || req.body.image || '').trim();
    }

    const collection = await db.collections.create({
      name,
      image: finalImage,
      coverImage: finalImage,
      description: (req.body.description || '').trim(),
      displayOrder: Number(req.body.displayOrder || 0),
      isActive: req.body.isActive !== undefined ? (req.body.isActive === 'true' || req.body.isActive === true) : true
    });
    res.status(201).json(collection);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Edit collection (Admin only - supports multipart file upload & JSON)
router.put('/collections/:id', authenticateToken(['admin']), handleCollectionUpload, async (req, res) => {
  try {
    const existing = await db.collections.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Collection not found' });

    // Step 4 & 7: Check if a new file was uploaded
    const uploadedFile = (req.files && (
      req.files['coverImage']?.[0] || 
      req.files['image']?.[0] || 
      req.files['file']?.[0] || 
      req.files['files']?.[0]
    )) || req.file;

    let finalImage = '';

    if (uploadedFile) {
      console.log(`[Collection Update] Received NEW cover image file: "${uploadedFile.originalname}" (${uploadedFile.size} bytes) -> stored as "${uploadedFile.filename}"`);

      if (isCloudinaryConfigured) {
        const result = await cloudinary.uploader.upload(uploadedFile.path, {
          resource_type: 'auto',
          folder: 'rainbow_jewellers/collections'
        });
        finalImage = result.secure_url;
        try { fs.unlinkSync(uploadedFile.path); } catch (e) {}
        console.log(`[Collection Update] Cloudinary upload complete: ${finalImage}`);
      } else {
        try {
          const fileBuffer = fs.readFileSync(uploadedFile.path);
          await db.images.create({
            filename: uploadedFile.filename,
            originalName: uploadedFile.originalname,
            mimeType: uploadedFile.mimetype || 'image/jpeg',
            data: fileBuffer.toString('base64'),
            size: uploadedFile.size
          });
          console.log(`[Collection Update] Persisted image "${uploadedFile.filename}" to MongoDB image store.`);
        } catch (dbErr) {
          console.error('[Collection Update] Warning: Failed to persist to db.images:', dbErr.message);
        }
        finalImage = `/uploads/${uploadedFile.filename}`;
        console.log(`[Collection Update] Saved local URL: ${finalImage}`);
      }
    } else {
      // Priority per Step 7: Only if NO new image was uploaded, check body or keep existing
      const bodyImg = (req.body.coverImage || req.body.image || '').trim();
      finalImage = bodyImg || existing.coverImage || existing.image || '';
    }

    const name = (req.body.name || existing.name || '').trim();
    if (!name) return res.status(400).json({ message: 'Collection name is required' });

    const description = req.body.description !== undefined ? req.body.description.trim() : (existing.description || '');
    const displayOrder = req.body.displayOrder !== undefined ? Number(req.body.displayOrder) : (existing.displayOrder || 0);
    const isActive = req.body.isActive !== undefined ? (req.body.isActive === 'true' || req.body.isActive === true) : existing.isActive;

    console.log(`[Collection Update] Updating MongoDB: ID="${req.params.id}", Name="${name}", coverImage="${finalImage}"`);

    const updated = await db.collections.findByIdAndUpdate(
      req.params.id,
      {
        name,
        image: finalImage,
        coverImage: finalImage,
        description,
        displayOrder,
        isActive
      },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    console.error('[Collection Update Error]', error);
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
    const rawImages = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);
    const parsedImages = rawImages.filter(img => typeof img === 'string' && img.trim() !== '');

    // Resolve category name from collectionId for backward compatibility
    let resolvedCategory = category || 'Bangles';
    if (collectionId) {
      const coll = await db.collections.findById(collectionId);
      if (coll) {
        resolvedCategory = coll.name;
      }
    }

    console.log(`[Product Create] Code: "${normalizedCode}", Name: "${name}", Images (${parsedImages.length}):`, parsedImages);

    const product = await db.products.create({
      name,
      code: normalizedCode,
      category: resolvedCategory,
      description: (description || '').trim(),
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
    const rawImages = Array.isArray(images) ? images : (images ? JSON.parse(images) : []);
    const parsedImages = rawImages.filter(img => typeof img === 'string' && img.trim() !== '');

    // Resolve category name from collectionId for backward compatibility
    let resolvedCategory = category;
    if (collectionId) {
      const coll = await db.collections.findById(collectionId);
      if (coll) {
        resolvedCategory = coll.name;
      }
    }

    console.log(`[Product Update] ID: "${req.params.id}", Code: "${normalizedCode}", Name: "${name}", Images (${parsedImages.length}):`, parsedImages);

    const updated = await db.products.findByIdAndUpdate(req.params.id, {
      name,
      code: normalizedCode,
      category: resolvedCategory,
      description: (description || '').trim(),
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
    }, { new: true });

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

// Route to upload up to 3 files or a single video (accepts any field name per Step 3)
router.post('/upload', upload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const productCode = (req.body && req.body.productCode) || (req.query && req.query.productCode) || '';
    const fileUrls = [];
    
    for (const file of req.files) {
      console.log(`[Upload API] Incoming file: "${file.originalname}" (${file.size} bytes), Product Code: "${productCode || 'N/A'}"`);

      if (isCloudinaryConfigured) {
        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          resource_type: 'auto',
          folder: 'rainbow_jewellers'
        });
        fileUrls.push(result.secure_url);
        console.log(`[Upload API] Product: ${productCode || 'N/A'} | Selected: ${file.originalname} | Cloudinary URL: ${result.secure_url}`);
        // Delete local temporary file
        try { fs.unlinkSync(file.path); } catch (e) {}
      } else {
        // Read file buffer and save to MongoDB persistent Image collection
        try {
          const fileBuffer = fs.readFileSync(file.path);
          const base64Data = fileBuffer.toString('base64');
          
          await db.images.create({
            filename: file.filename,
            originalName: file.originalname,
            mimeType: file.mimetype || 'image/jpeg',
            data: base64Data,
            size: file.size
          });
          console.log(`[Upload API] Persisted image "${file.filename}" to MongoDB image store.`);
        } catch (dbErr) {
          console.error('[Upload API] Warning: Failed to persist image to MongoDB:', dbErr.message);
        }

        const savedUrl = `/uploads/${file.filename}`;
        fileUrls.push(savedUrl);
        console.log(`[Upload API] Product ${productCode || 'N/A'} | Selected: ${file.originalname} | Saved URL: ${savedUrl}`);
      }
    }

    res.json({ urls: fileUrls });
  } catch (error) {
    console.error('[Upload API Error]', error);
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
