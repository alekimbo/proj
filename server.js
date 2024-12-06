const express = require("express");
const session = require("express-session");
const conn = require("./db"); 
const reviewsRouter = require("./routes/reviews")(conn); 
const authRouter = require("./routes/auth"); 
const path = require("path"); 

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Session setup
app.use(session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 600000 } // Session valid for 10 minutes
}));

// Root route (Dashboard)
app.get("/", (req, res) => {
    if (req.session.user) {
        const successMessage = req.query.success ? "Review posted successfully!" : "";
        res.send(`
            <h1>Welcome to the Song Reviews App!</h1>
            <p>${successMessage}</p>
            <a href='/auth/logout'>Logout</a> | 
            <a href='/reviews/post'>Post a Review</a> | 
            <a href='/reviews'>View Reviews</a>
        `);
    } else {
        res.send(`
            <h1>Welcome to Song Reviews!</h1>
            <p>Please <a href='/auth/login'>Login</a> or <a href='/auth/register'>Register</a> to access the reviews.</p>
        `);
    }
});

// Serve the song review form
app.get("/reviews/post", (req, res) => {
    if (req.session.user) {
        res.sendFile(path.join(__dirname, "views", "post.html"));
    } else {
        res.redirect("/auth/login"); 
    }
});

app.post("/reviews/post", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    const { songName, reviewText, rating } = req.body;

    if (!songName || !reviewText || !rating) {
        return res.status(400).send("All fields are required.");
    }

    const query = "INSERT INTO song_reviews (song_name, review_text, rating, user_id) VALUES (?, ?, ?, ?)";
    conn.query(query, [songName, reviewText, rating, req.session.user.id], (err) => {
        if (err) {
            console.error("Error posting review:", err);
            res.status(500).send("Error posting review");
        } else {
            res.redirect("/?success=true");
        }
    });
});

app.get("/reviews", (req, res) => {
    const query = "SELECT song_name, review_text, rating FROM song_reviews";
    conn.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching reviews:", err);
            res.status(500).send("Error fetching reviews");
        } else {
            let reviewsHtml = "<h1>Song Reviews</h1><ul>";
            results.forEach(review => {
                reviewsHtml += `
                    <li>
                        <strong>${review.song_name}</strong><br>
                        Rating: ${review.rating}<br>
                        Review: ${review.review_text}<br><br>
                    </li>
                `;
            });
            reviewsHtml += "</ul>";
            res.send(reviewsHtml);
        }
    });
});

app.get("/reviews/edit", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    const query = "SELECT id, song_name, review_text, rating FROM song_reviews WHERE user_id = ?";
    conn.query(query, [req.session.user.id], (err, results) => {
        if (err) {
            console.error("Error fetching reviews:", err);
            res.status(500).send("Error fetching reviews");
        } else {
            if (results.length === 0) {
                res.send("<p>You have no reviews to edit or delete.</p>");
            } else {
                let reviewsHtml = "<h1>Edit or Delete Your Reviews</h1><ul>";
                results.forEach(review => {
                    reviewsHtml += `
                        <li>
                            <h3>${review.song_name}</h3>
                            <p>${review.review_text}</p>
                            <p>Rating: ${review.rating}</p>
                            <a href="/reviews/edit/${review.id}">Edit</a> | 
                            <a href="/reviews/delete/${review.id}">Delete</a>
                        </li>
                    `;
                });
                reviewsHtml += "</ul>";
                res.send(reviewsHtml);
            }
        }
    });
});

app.get("/reviews/edit/:id", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    const reviewId = req.params.id;
    const query = "SELECT * FROM song_reviews WHERE id = ? AND user_id = ?";
    conn.query(query, [reviewId, req.session.user.id], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).send("Review not found or not authorized.");
        }

        const review = result[0];
        res.send(`
            <h1>Edit Your Review</h1>
            <form action="/reviews/edit/${review.id}" method="POST">
                <label for="songName">Song Name:</label>
                <input type="text" id="songName" name="songName" value="${review.song_name}" required><br><br>

                <label for="rating">Rating (1-5):</label>
                <input type="number" id="rating" name="rating" min="1" max="5" value="${review.rating}" required><br><br>

                <label for="reviewText">Review:</label><br>
                <textarea id="reviewText" name="reviewText" rows="4" cols="50" required>${review.review_text}</textarea><br><br>

                <button type="submit">Update Review</button>
            </form>
        `);
    });
});

app.post("/reviews/edit/:id", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    const reviewId = req.params.id;
    const { songName, rating, reviewText } = req.body;

    if (!songName || !rating || !reviewText) {
        return res.status(400).send("All fields are required.");
    }

    const query = "UPDATE song_reviews SET song_name = ?, review_text = ?, rating = ? WHERE id = ? AND user_id = ?";
    conn.query(query, [songName, reviewText, rating, reviewId, req.session.user.id], (err) => {
        if (err) {
            console.error("Error updating review:", err);
            res.status(500).send("Error updating review");
        } else {
            res.redirect("/reviews/edit");
        }
    });
});

app.get("/reviews/delete/:id", (req, res) => {
    if (!req.session.user) {
        return res.redirect("/auth/login");
    }

    const reviewId = req.params.id;
    const query = "DELETE FROM song_reviews WHERE id = ? AND user_id = ?";
    conn.query(query, [reviewId, req.session.user.id], (err) => {
        if (err) {
            console.error("Error deleting review:", err);
            res.status(500).send("Error deleting review");
        } else {
            res.redirect("/reviews/edit");
        }
    });
});

// Use the auth router for authentication routes
app.use("/auth", authRouter);

// Start the server
app.listen(3000, () => console.log("Server running on http://localhost:3000"));
