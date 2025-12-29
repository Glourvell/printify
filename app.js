const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// ✅ FIX FOR RENDER SESSION COOKIES
app.set('trust proxy', 1);

// MongoDB Atlas connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
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

// ✅ FIXED: MongoStore.create() for CommonJS + connect-mongo@6+
const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000
  },
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    ttl: 24 * 60 * 60, // 1 day
    autoRemove: "native"
  })
};

app.use(session(sessionConfig));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Routes
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const catalogRoutes = require('./routes/catalog');
const productRoutes = require('./routes/products');
const storeRoutes = require('./routes/store');
const buyerRoutes = require('./routes/buyer');

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
