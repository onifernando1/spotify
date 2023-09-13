var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
const ytdl = require("ytdl-core");
require("dotenv").config();
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const readline = require("readline");
const axios = require("axios");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const videoId = "YLslsZuEaNE";
console.log("hey");

const downloadSong = async (id, title) => {
  try {
    const stream = await ytdl(id, { quality: "highestaudio" });
    let start = Date.now();
    ffmpeg(stream)
      .audioBitrate(128)
      .save(`/home/onifernando1/spotify/${title}.mp3`)
      .on("progress", (p) => {
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(`${p.targetSize}kb downloaded`);
      })
      .on("end", () => {
        console.log(`\ndone, thanks - ${(Date.now() - start) / 1000}s`);
      });
  } catch (error) {
    console.error(error);
  }
};

const getFirstVideoFromSearch = async (query) => {
  const list = await axios.get(
    `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${query}&type=video&key=${process.env.API_KEY}`
  );
  return list.data.items[0].id.videoId;
};

const getFirstVideoTitleFromSearch = async (query) => {
  const list = await axios.get(
    `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=25&q=${query}&type=video&key=${process.env.API_KEY}`
  );
  return list.data.items[0].snippet.title;
};

const createQuery = (query) => {
  let queryArray = query.split("");
  let spacesChangedArray = queryArray.map((letter) => {
    if (letter == " ") {
      return "%20";
    } else {
      return letter;
    }
  });
  let finalQuery = spacesChangedArray.join("");
  return finalQuery;
};

const runDownloads = async (queriesArray) => {
  queriesArray.forEach(async (query) => {
    let convertedQuery = createQuery(query);
    let videoId = await getFirstVideoFromSearch(convertedQuery);
    let videoTitle = await getFirstVideoTitleFromSearch(convertedQuery);
    await downloadSong(videoId, videoTitle);
  });
};

let listOfSongs = ["quello che eravamo prima", "aupinard tous les jours"];

runDownloads(listOfSongs);

module.exports = app;
