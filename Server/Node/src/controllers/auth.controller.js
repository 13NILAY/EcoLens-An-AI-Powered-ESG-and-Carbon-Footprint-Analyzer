const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!["company", "investor"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Check if user already exists
    const userExists = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role`,
      [name, email, hashedPassword, role]
    );

    const user = newUser.rows[0];

    // 🔥 ROLE SETUP STARTS HERE 🔥

    if (role === "company") {
      await pool.query(
        `INSERT INTO companies (user_id, name)
         VALUES ($1, $2)`,
        [user.id, name || "New Company"]
      );
    }

    if (role === "investor") {
      await pool.query(
        `INSERT INTO investor_profiles (user_id)
         VALUES ($1)`,
        [user.id]
      );
    }

    // 🔥 ROLE SETUP ENDS HERE 🔥

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(201).json({
      message: "Signup successful",
      token,
      user,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    // Find user
    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { signup,login };
