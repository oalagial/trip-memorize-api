const f1 = require("@ffmpeg-installer/ffmpeg");
const f2 = require("@ffprobe-installer/ffprobe");
const ffmpeg = require("fluent-ffmpeg");
const videoshow = require("videoshow");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const ffmpegPath = f1.path;
const ffprobePath = f2.path;

ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);

async function clearFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
    return;
  }
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    fs.unlinkSync(path.join(folderPath, file));
  }
}

async function resizeImages(imagesDir, outputDir, width, height) {
  await clearFolder(outputDir);
  const files = fs.readdirSync(imagesDir);
  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
      const filePath = path.join(imagesDir, file);
      const outputPath = path.join(outputDir, file);
      await sharp(filePath).resize(width, height).toFile(outputPath);
    }
  }
}

async function generateVideoFunc(callback) {
  const imagesDir = path.join(__dirname, "../storage/uploaded_images");
  const resizedDir = path.join(__dirname, "../storage/resized_images");

  // Resize all images into resized_images folder
  await resizeImages(imagesDir, resizedDir, 640, 480);

  // Use only resized images
  const images = fs
    .readdirSync(resizedDir)
    .filter((file) => {
      const extension = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif"].includes(extension);
    })
    .map((file) => path.join(resizedDir, file));

  if (images.length === 0) {
    console.error("No images found in resized_images directory.");
    return callback(null);
  }

  const videoOptions = {
    fps: 25,
    loop: 5,
    transition: true,
    transitionDuration: 1,
    videoBitrate: 1024,
    videoCodec: "libx264",
    size: "640x480",
    audioBitrate: "128k",
    audioChannels: 2,
    format: "mp4",
    pixelFormat: "yuv420p",
  };

  const videoFilePath = path.join(__dirname, "../storage/generatedVideo.mp4");

  videoshow(images, videoOptions)
    .save(videoFilePath)
    .on("start", function (command) {
      console.log("ffmpeg process started:", command);
    })
    .on("error", function (err, stdout, stderr) {
      console.error("Error:", err);
      console.error("ffmpeg stderr:", stderr);
    })
    .on("end", function (output) {
      console.error("Video created in:", output);
      callback(videoFilePath);
    });
}

module.exports = {
  generateVideoFunc,
};
