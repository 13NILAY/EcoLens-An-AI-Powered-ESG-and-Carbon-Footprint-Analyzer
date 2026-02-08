require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./config/db"); // Changed from "./db" to "../db"
const authRoutes= require("./routes/auth.routes");
const app = express();
const companyRoutes =require("./routes/company.routes")
const investorRoutes = require("./routes/investor.routes");
const investorDashboardRoutes = require("./routes/investor.dashboard.routes");
const investorComparisonRoutes = require("./routes/investor.comparison.routes");


// Middleware
app.use(cors());
app.use(express.json());


// Test route
app.get("/", (req, res) => {
  res.send("EcoLens backend is running 🚀");
});

// Test database connection
app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ 
      success: true, 
      message: "Database connected",
      time: result.rows[0].now 
    });
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/investor", investorRoutes);
app.use("/api/investor", investorDashboardRoutes);
app.use("/api/investor", investorComparisonRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

