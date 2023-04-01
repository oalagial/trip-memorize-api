const f1 = require("@ffmpeg-installer/ffmpeg");
const f2 = require("@ffprobe-installer/ffprobe");
const ffmpeg = require("fluent-ffmpeg");
const videoshow = require("videoshow");
const path = require("path");
const fs = require("fs");

const ffmpegPath = f1.path;
const ffprobePath = f2.path;

ffmpeg.setFfprobePath(ffprobePath);
ffmpeg.setFfmpegPath(ffmpegPath);

function generateVideoFunc(callback) {
  const imagesDir = "./Images";

  const images = fs
    .readdirSync(imagesDir)
    .filter((file) => {
      const extension = path.extname(file);
      return [".jpg", ".jpeg", ".png", ".gif"].includes(extension);
    })
    .map((file) => path.join(imagesDir, file));

  const videoOptions = {
    fps: 25,
    loop: 5, // seconds
    transition: true,
    transitionDuration: 1, // seconds
    videoBitrate: 1024,
    videoCodec: "libx264",
    size: "640x?",
    audioBitrate: "128k",
    audioChannels: 2,
    format: "mp4",
    pixelFormat: "yuv420p",
  };

  const videoFilePath = path.join(__dirname, "generatedVideo.mp4");

  videoshow(images, videoOptions)
    //   .audio("audio.mp3")
    .save("generatedVideo.mp4")
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
  // Call the callback function with the path to the video file
}

module.exports = {
  generateVideoFunc,
};
