const { generateVideoFunc } = require("../services/videoService");

exports.getVideo = (req, res) => {
  generateVideoFunc((videoFilePath) => {
    if (!videoFilePath) {
      return res.status(500).send("Video generation failed.");
    }
    res.sendFile(videoFilePath, (err) => {
      if (err) {
        console.error(err);
        res.status(err.status || 500).end();
      } else {
        console.log(`Sent video file: ${videoFilePath}`);
      }
    });
  });
};