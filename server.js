const express = require("express");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const videoController = require("./controllers/videoController");

const server = express();
// server.use(cors());
// server.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "PUT", "POST", "DELETE"],
//   })
// );
// server.use(
//   cors({
//     origin: ["http://localhost:3000", "https://*.ngrok.io"],
//     methods: ["GET", "PUT", "POST", "DELETE"],
//   })
// );
// // Enable CORS
server.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Set up storage location and file name
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "storage/uploaded_images");
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});

// Set up multer middleware with storage and file type limits
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // limit file size to 5MB
    files: 1, // limit number of files to 1
  },
  fileFilter: (req, file, cb) => {
    console.log("upload", file);

    const fileTypes = /jpeg|jpg|png|gif/; // allowed file types
    const extname = fileTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = fileTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
}).any();  // the name of the file input field in the HTML form

// Route to handle image uploads
server.post("/upload", (req, res) => {
  console.log("upload");
  upload(req, res, (err) => {
    if (err) {
      console.log("err.message", err.message);
      res.status(400).send(err.message);
    } else {
      if (!req.file) {
        res.status(400).send("No file selected");
      } else {
        res.send(`File uploaded successfully: ${req.file.filename}`);
      }
    }
  });
});

// Create an endpoint for downloading the video file
server.get("/video", videoController.getVideo);
server.get("/generate_fancy_video", videoController.getFancyVideo);

server.get("/api", (req, res) => {
  console.log("api");
  res.send("Hello, world!");
});

// Start the server
server.listen(4000, () => {
  console.log("Server listening on port 4000");
});
