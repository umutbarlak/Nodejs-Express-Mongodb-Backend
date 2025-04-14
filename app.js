const express = require("express");
const tourRouter = require("./routes/tourRoutes.js");
const userRouter = require("./routes/userRoutes.js");
const reviewRouter = require("./routes/reviewRoutes.js");
const cookieParser = require("cookie-parser");
const error = require("./utils/error.js");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const sanitize = require("express-mongo-sanitize");
const hpp = require("hpp");

const app = express();

// rate limit: aynı ip adresinden belirli bir sürede gelebilecek istek sınırını belirle
const limiter = rateLimit({
  limit: 100,
  windowMs: 15 * 60 * 1000,
  message:
    "Kısa süre içerinde çok fazla istekte bulundunuz. Lütfen daha sonra tekrar deneyiniz",
});
// client'a gönderilen cevaba güvenlik amaçlı http headerları ekler
app.use(helmet());
// rate limit aynı ip adresinden belirli bir süre içerisinde gelebilecek istek sınırını belirler
app.use("/api", limiter);
// client'tan gelen json verisini js 'e çeviri (max kota)
app.use(express.json({ limit: "10kb" }));
// (body,headers,params,query) alanlarında mongodb kodu tespit ettiği zaman bozar
app.use(sanitize());
// hpp: parametre kirliliğini önler
app.use(hpp());
// gelen çerezleri işleyip erişebilir hale getirir
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/tours", tourRouter);
app.use("/api/reviews", reviewRouter);

app.all("*", (req, res, next) => {
  const err = error(404, "İstek attığınız yol mevcut değil");
  next(err);
});

app.use((err, req, res, next) => {
  console.log(err.stack);

  err.message = err.message || "Üzgünüz bir hata meydana geldi";
  err.status = err.status || "fail";
  err.statusCode = err.statusCode || 500;

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
