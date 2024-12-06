const express = require("express");
const router = express.Router();
const path = require("path");
const conn = require("../db"); // Import the connection from db.js

// Middleware to check if the user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next(); // User is authenticated, proceed to the next middleware
  } else {
    res.redirect("/auth/login"); // Redirect to login if not authenticated
  }
}

// Serve the registration form
router.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/register.html")); // Adjust the path if needed
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error logging out:", err);
      return res.status(500).send("Error logging out.");
    }
    res.redirect("/auth/login"); // Redirect to the login page
  });
});

// Serve the login form
router.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/login.html")); // Adjust the path if needed
});

// Serve the dashboard page
router.get("/dashboard", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "../views/dashboard.html")); // Adjust the path if needed
});

// Handle registration form submission
router.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("All fields are required.");
  }

  const query = "INSERT INTO users (username, password) VALUES (?, ?)";
  conn.query(query, [username, password], (err) => {
    if (err) {
      console.error("Error registering user:", err);
      res.status(500).send("Registration failed");
    } else {
      res.send("Registration successful!");
    }
  });
});

// Handle login form submission
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send("All fields are required.");
  }

  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  conn.query(query, [username, password], (err, results) => {
    if (err) {
      console.error("Error during login:", err);
      res.status(500).send("Login failed");
    } else if (results.length > 0) {
      req.session.user = results[0]; // Store user info in session
      res.redirect("/auth/dashboard"); // Redirect to dashboard after successful login
    } else {
      res.status(401).send("Invalid username or password");
    }
  });
});

// Serve the review posting form
router.get("/post", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/post_review.html"));
});

// Handle review submission
router.post("/post", (req, res) => {
  const { song, artist, review } = req.body;

  if (!song || !artist || !review) {
      return res.status(400).send("All fields are required.");
  }

  const query = "INSERT INTO reviews (song, artist, review, user_id) VALUES (?, ?, ?, ?)";
  const userId = req.session.user?.id || null; // Associate with logged-in user if available

  conn.query(query, [song, artist, review, userId], (err) => {
      if (err) {
          console.error("Error saving review:", err);
          res.status(500).send("Failed to save review.");
      } else {
          res.send("Review posted successfully! <a href='/dashboard'>Go back to Dashboard</a>");
      }
  });
});

// Serve the profile data
router.get("/profile", isAuthenticated, (req, res) => {
  const userId = req.session.user.id;

  conn.query("SELECT username FROM users WHERE id = ?", [userId], (err, results) => {
      if (err) {
          console.error("Error fetching user profile:", err);
          return res.status(500).send("An error occurred while fetching the profile.");
      }

      if (results.length === 0) {
          return res.status(404).send("Profile not found.");
      }

      // Return the username
      res.json({ username: results[0].username });
  });
});

module.exports = router;
