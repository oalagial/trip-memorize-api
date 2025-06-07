const f1 = require("@ffmpeg-installer/ffmpeg");
const f2 = require("@ffprobe-installer/ffprobe");
const ffmpeg = require("fluent-ffmpeg");
const videoshow = require("videoshow");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { createCanvas, loadImage } = require('canvas');

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
    .filter((file) => [".jpg", ".jpeg", ".png", ".gif"].includes(path.extname(file).toLowerCase()))
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function drawFirework(ctx, x, y, radius, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
    ctx.stroke();
  }
  ctx.restore();
}

async function createMovingRectFrames(images, cellWidth, cellHeight, framesDir, canvasWidth, canvasHeight) {
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir, { recursive: true });

  // Load all special effect PNGs
  const effectsDir = path.join(__dirname, "../storage/special_effects");
  const effectFiles = fs.readdirSync(effectsDir)
    .filter(file => file.endsWith('.png'))
    .map(file => path.join(effectsDir, file));

  // Preload all effect images
  const effectImgs = await Promise.all(effectFiles.map(f => loadImage(f)));

  const iconWidth = 120;
  const iconHeight = 120;

  for (let i = 0; i < images.length; i++) {
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    // Random position for the rectangle
    const x = getRandomInt(0, canvasWidth - cellWidth);
    const y = getRandomInt(0, canvasHeight - cellHeight);

    // Draw the main image
    const img = await loadImage(images[i]);
    ctx.drawImage(img, x, y, cellWidth, cellHeight);

    // Pick a random special effect image
    const effectImg = effectImgs[getRandomInt(0, effectImgs.length - 1)];

    // Place the icon in a corner away from the image
    let iconX = 0, iconY = 0;
    if (y < canvasHeight / 2) {
      iconX = canvasWidth - iconWidth - 10;
      iconY = canvasHeight - iconHeight - 10;
    } else {
      iconX = 10;
      iconY = 10;
    }
    ctx.drawImage(effectImg, iconX, iconY, iconWidth, iconHeight);

    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(framesDir, `frame${String(i + 1).padStart(3, '0')}.png`), buffer);
  }
}

async function fancyVideoFunc(callback) {
  const imagesDir = path.join(__dirname, "../storage/uploaded_images");
  const framesDir = path.join(__dirname, "../storage/moving_rect_frames");
  const outputVideo = path.join(__dirname, "../storage/fancyVideo.mp4");

  const images = fs
    .readdirSync(imagesDir)
    .filter((file) => [".jpg", ".jpeg", ".png", ".gif"].includes(path.extname(file).toLowerCase()))
    .map((file) => path.join(imagesDir, file));

  if (images.length === 0) {
    return callback(null, new Error("No images found for fancy video"));
  }

  const cellWidth = 320;
  const cellHeight = 240;
  const canvasWidth = 800;
  const canvasHeight = 600;

  // 1. Create frames with random rectangles and fireworks
  await createMovingRectFrames(images, cellWidth, cellHeight, framesDir, canvasWidth, canvasHeight);

  // 2. Use ffmpeg to make a video from the frames
  ffmpeg()
    .input(path.join(framesDir, 'frame%03d.png'))
    .inputOptions(['-framerate 1/3']) // 1 frame every 5 seconds
    .outputOptions([
      "-pix_fmt", "yuv420p",
      "-c:v", "libx264",
      "-r", "25"
    ])
    .save(outputVideo)
    .on("end", () => callback(outputVideo))
    .on("error", (err) => {
      console.error("FFmpeg error:", err);
      callback(null, err);
    });
}

module.exports = {
  generateVideoFunc,
  fancyVideoFunc,
};
