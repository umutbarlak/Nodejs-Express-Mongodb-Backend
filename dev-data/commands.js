const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const Review = require("../models/reviewModel");
const mongoose = require("mongoose");
const fs = require("fs");

require("dotenv").config();

//veri tabanına bağlan
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Veri tabanına bağlandı");
  })
  .catch((err) => {
    console.log("Veri tabaına bağlanamadı", err);
  });

const tours = JSON.parse(fs.readFileSync(`${__dirname}/data/tours.json`));
const users = JSON.parse(fs.readFileSync(`${__dirname}/data/users.json`));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/data/reviews.json`));

const importData = async () => {
  try {
    await Tour.create(tours, { validateBeforeSave: false });
    await User.create(users, { validateBeforeSave: false });
    await Review.create(reviews, { validateBeforeSave: false });
    console.log("bütün eklendi");
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

const clearData = async () => {
  try {
    await Tour.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("bütün veriler temizlendi");
  } catch (error) {
    console.log(error);
  }

  process.exit();
};

if (process.argv.includes("--import")) {
  importData();
} else if (process.argv.includes("--clear")) {
  clearData();
}
