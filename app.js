const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const { generateVideoFunc } = require("./generateVideo.js");

const app = express();
// app.use(cors());
// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "PUT", "POST", "DELETE"],
//   })
// );
// app.use(
//   cors({
//     origin: ["http://localhost:3000", "https://*.ngrok.io"],
//     methods: ["GET", "PUT", "POST", "DELETE"],
//   })
// );
// // Enable CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/api", (req, res) => {
  res.send("Hello, world!");
});

// Start the server
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
