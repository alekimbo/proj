module.exports = (conn) => {
    const express = require("express");
    const router = express.Router();
  
    router.post("/create", (req, res) => {
      if (!req.session.user) return res.status(401).send("Login required.");
  
      const { title, content } = req.body;
      conn.query(
        "INSERT INTO reviews (user_id, title, content) VALUES (?, ?, ?)",
        [req.session.user.id, title, content],
        (err) => {
          if (err) {
            console.error("Error creating review:", err);
            res.status(500).send("Failed to create review.");
          } else {
            res.send("Review created successfully!");
          }
        }
      );
    });

    router.get("/view", (req, res) => {
      conn.query("SELECT * FROM reviews", (err, results) => {
          if (err) {
              console.error("Error fetching reviews:", err);
              res.status(500).send("Failed to fetch reviews.");
          } else {
              res.json(results); // Return reviews as JSON
          }
      });
  });
  
    router.get("/view", (req, res) => {
      conn.query("SELECT * FROM reviews ORDER BY created_at DESC", (err, reviews) => {
          if (err) {
              console.error("Error fetching reviews:", err);
              res.status(500).send("Failed to load reviews.");
          } else {
              res.json(reviews);  // Send the reviews as JSON
          }
      });
  });
  
    router.post("/edit/:id", (req, res) => {
      if (!req.session.user) return res.status(401).send("Login required.");
  
      const { id } = req.params;
      const { title, content } = req.body;
      conn.query(
        "UPDATE reviews SET title = ?, content = ? WHERE id = ? AND user_id = ?",
        [title, content, id, req.session.user.id],
        (err) => {
          if (err) {
            console.error("Error editing review:", err);
            res.status(500).send("Failed to edit review.");
          } else {
            res.send("Review edited successfully!");
          }
        }
      );
    });
  
    router.post("/delete/:id", (req, res) => {
      if (!req.session.user) return res.status(401).send("Login required.");
  
      const { id } = req.params;
      conn.query(
        "DELETE FROM reviews WHERE id = ? AND user_id = ?",
        [id, req.session.user.id],
        (err) => {
          if (err) {
            console.error("Error deleting review:", err);
            res.status(500).send("Failed to delete review.");
          } else {
            res.send("Review deleted successfully!");
          }
        }
      );
    });
  
    return router;
  };
  