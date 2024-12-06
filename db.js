const mysql = require("mysql");

const conn = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "song_reviews"
});

conn.connect(err => {
    if (err) console.error("Error connecting to MySQL:", err);
    else console.log("Connected to MySQL");
});

module.exports = conn;
