const Tour = require("../models/tourModel.js");
const e = require("../utils/error.js");
const APIFeatures = require("../utils/apiFeatures.js");
const c = require("../utils/catchAsync.js");
const factory = require("./handlerFactory.js");

exports.getAllTours = factory.getAll(Tour);
exports.createTour = factory.createOne(Tour);
exports.getTour = factory.getOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);
exports.updateTour = factory.updateOne(Tour);

exports.getTourStats = c(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.0 } },
    },
    {
      $group: {
        _id: "$difficulty",
        count: { $sum: 1 },
        avgRating: { $avg: "$ratingsAverage" },
        avgPrice: { $avg: "$price" },
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
      },
    },
    {
      $sort: {
        avgPrice: 1,
      },
    },
    { $match: { avgPrice: { $gte: 500 } } },
  ]);

  return res.status(200).json({ message: "Rapor Oluşturuldu", stats });
});
exports.getMonthlyPlan = c(async (req, res, next) => {
  const year = Number(req.params.year);
  const stats = await Tour.aggregate([
    [
      {
        $unwind: {
          path: "$startDates",
        },
      },
      {
        $match: {
          startDates: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            $month: "$startDates",
          },
          count: {
            $sum: 1,
          },
          tours: {
            $push: "$name",
          },
        },
      },
      {
        $addFields: {
          month: "$_id",
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
      {
        $sort: {
          month: 1,
        },
      },
    ],
  ]);

  if (stats.length === 0) {
    return next(e(400, `${year} yılında herhangi bir tur başlamıyor`));
  }

  res.status(200).json({
    message: `${year} yılı için aylık plan oluşturuldu.`,
    stats,
  });
});
exports.aliasTopTours = (req, res, next) => {
  req.query.sort = "-ratinAverage,-ratingsQuantity";
  req.query["price[lte]"] = "1200";
  req.query.limit = 5;
  req.query.fields = "name,price,ratingAverage,summary,diffuculty";

  next();
};

// belirli koordinatlardaki turları filtrele

exports.getToursWithin = c(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;

  const [lat, lng] = latlng.split(",");
  // merkez noktası gönderilmediyse hata gönder
  if (!lat || !lng) return next(e(400, "Lütfen merkezi belirleyin"));

  const radius = unit === "mi" ? distance / 3959 : distance / 6371;

  console.log(distance, radius);

  const tours = await Tour.find({
    startLocation: {
      $geoWithin: {
        $centerSphere: [[lat, lng], radius],
      },
    },
  });

  res.status(200).json({
    message: "Sınırlar içerisindeki turlar alındı",
    tours,
  });
});

// bu özelliği kullanmak için yani (konuma olan uzaklığı hesaplamak için) locations index in oluşturulması gerekli
exports.getDistances = c(async (req, res, next) => {
  const { latlng, unit } = req.params;

  const [lat, lng] = latlng.split(",");

  // enlem boylam yoksa hata fırlat
  if (!lat || !lng) return next(e(400, "Lütfen merkez noktayı tanımlayın"));

  const multiplier = unit === "mi" ? 0.000621371192 : 0.001;

  // turların merkez noktadan olan uzaklığını hesapla
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [+lat, +lng] },
        distanceField: "distance",
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        name: 1,
        distance: 1,
      },
    },
  ]);

  res.status(200).json({
    message: "Uzaklıklar hesaplandı",
    distances,
  });
});
