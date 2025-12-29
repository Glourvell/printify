import express from "express";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Trust proxy for Render HTTPS
app.set('trust proxy', 1);

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI) // <- no options needed
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err.message));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Disable caching for dev
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// ✅ Updated session configuration with MongoDB store for Render
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,       // ✅ Use HTTPS on Render
    httpOnly: true,
    sameSite: "lax",    // ✅ Helps with cross-site requests
    maxAge: 24 * 60 * 60 * 1000
  },
  store: new MongoStore({   // ✅ Constructor works with connect-mongo@6
    mongoUrl: MONGODB_URI,
    ttl: 24 * 60 * 60,      // 1 day
    autoRemove: "native"
  })
};

app.use(session(sessionConfig));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import catalogRoutes from './routes/catalog.js';
import productRoutes from './routes/products.js';
import storeRoutes from './routes/store.js';
import buyerRoutes from './routes/buyer.js';

app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/catalog', catalogRoutes);
app.use('/products', productRoutes);
app.use('/store', storeRoutes);
app.use('/shop', buyerRoutes);

// Optional MongoDB test route
app.get("/test-mongo", async (req, res) => {
  try {
    const admin = mongoose.connection.db.admin();
    const info = await admin.serverStatus();
    res.send(`MongoDB is connected. Host: ${info.host}`);
  } catch (err) {
    res.send(`MongoDB connection failed: ${err.message}`);
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render("pages/error", { message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
