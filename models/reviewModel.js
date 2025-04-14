const { Schema, model } = require("mongoose");
const Tour = require("./tourModel");

const reviewShema = new Schema(
  {
    review: {
      type: String,
      required: [true, "Yorum alanı boş bırakılamaz"],
    },
    rating: {
      type: Number,
      min: [1, "Rating değeri 1 den küçük olmaz"],
      max: [5, "Rating değeri 5 den büyük olmaz"],
      required: [true, "Puan değeri tanımlı olmalı"],
    },
    user: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "Yorumun hangi tour için yapıldığını belirtiniz"],
    },
    tour: {
      type: Schema.ObjectId,
      ref: "Tour",
      required: [true, "Yorumun hangi tour için yapıldığını belirtiniz"],
    },
  },
  { timestamps: true }
);

reviewShema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

reviewShema.statics.calcAverage = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: {
        tour: tourId,
      },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].avgRating.toFixed(1),
      ratingsQuantity: stats[0].nRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsAverage: 4,
      ratingsQuantity: 0,
    });
  }
};

// her yeni yorum yapıldığında / silindiğinde / güncellendiğinde yukarıdaki metodu çalıştırıp güncel
// rating değerlerini alıp tour belgesini güncelle

reviewShema.post("save", function () {
  Review.calcAverage(this.tour);
});
reviewShema.post(/^findOneAnd/g, function (document) {
  Review.calcAverage(document.tour);
});
reviewShema.post(/^findByIdAnd/g, function (document) {
  Review.calcAverage(document.tour);
});

//? veri tabanında şuanda unique durumu bozan veriler olduğu için mongodb bu index in kullanımını engelliyor
reviewShema.index({ user: 1 }, { unique: true });

const Review = model("Review", reviewShema);

module.exports = Review;
