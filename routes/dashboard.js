module.exports = (conn) => {
    const express = require("express");
    const router = express.Router();
  
    router.get("/", (req, res) => {
      if (!req.session.user) {
        return res.status(401).send("You must be logged in to view this page.");
      }
  
      const userId = req.session.user.id;
      conn.query(
        "SELECT * FROM reviews WHERE user_id = ?",
        [userId],
        (err, results) => {
          if (err) {
            console.error("Error fetching reviews:", err);
            return res.status(500).send("An error occurred while loading your dashboard.");
          }
  
          res.render("dashboard", {
            username: req.session.user.username,
            reviews: results,
          });
        }
      );
    });
    // Serve the About page
router.get("/about", (req, res) => {
  if (!req.session.user) {
      return res.status(401).send("You must be logged in to view this page.");
  }
  res.sendFile(path.join(__dirname, "../views/about.html"));
});
  
    return router;
  };
  