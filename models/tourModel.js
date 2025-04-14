const mongoose = require("mongoose");
const validator = require("validator");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      unique: [true, "Bu tur ismi zaten mevcut"],
      required: [true, "Tur isim değerine sahip olmalı"],
      // validate: [
      //   validator.isAlphanumeric, //third party validator
      //   "Tur ismi özel karakter içermemeli",
      // ],
    },
    duration: {
      type: Number,
      required: [true, "Tur süre değerine sahip olmalı"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "Tur maksimum kişi sayısına sahip olmalı"],
    },
    difficulty: {
      type: String,
      required: [true, "Tur zorluk değerine sahip olmalı"],
      enum: ["easy", "medium", "hard", "difficult"],
    },
    ratingsAverage: {
      type: Number,
      min: [1, "Rating değeri 1'den küçük olamaz"],
      max: [5, "Rating değeri 5'den küçük olamaz"],
      default: 4.0,
    },
    ratingsQuantity: { type: Number, default: 0 },
    price: {
      type: Number,
      required: [true, "Tur fiyat değerine sahip olmalı"],
    },
    priceDiscount: {
      type: Number,
      //costum validator (kendi yazdığımız kontrol metodları)
      // false return ederse doğrulamadan geçmez ve kaydedilmez ama true dönerse geçer ve kaydedilir
      validate: {
        validator: function (value) {
          return value < this.price;
        },
        message: "İndirim fiyatı asıl fiyattan büyük olamaz",
      },
    },
    summary: {
      type: String,
      maxLength: [200, "Özet alanı 200 karakteri geçemez"],
      required: [true, "Tur özet değerine sahip olmalı"],
    },
    description: {
      type: String,
      maxLength: [1000, "Açıklama alanı 200 karakteri geçemez"],
      required: [true, "Tur açıklama değerine sahip olmalı"],
    },
    imageCover: {
      type: String,
      required: [true, "Tur kapak fotoğrafına sahip olmalı"],
    },
    images: {
      type: [String],
    },
    startDates: {
      type: [Date],
      required: [true, "Tur tarih değerine sahip olmalı"],
    },
    durationHour: { type: Number },
    //embedding
    startLocation: {
      description: String,
      type: { type: String, default: "Point", enum: "Point" },
      coordinates: [Number],
      address: String,
    },
    locations: [
      {
        description: String,
        type: { type: String, default: "Point", enum: "Point" },
        coordinates: [Number],
        address: String,
        day: Number,
      },
    ],
    //ref
    guides: [
      {
        type: mongoose.Schema.ObjectId, //referans tanımında tip her zaman Object Id'dir
        ref: "User", // id'leri hangi kollectiona ait oluduğunu seyledik
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

//! Virtual Property
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour", // bu dökümanın _id alanını yorum doc daki karşılığı
  localField: "_id", // yorum doc un tur alanının bu doctaki karşılığı
});

//! Virtual Property
//VERİ TABANINDA TUTMAMIZ GEREKSİZ OLAN VERİLERİ CEVAP GÖNDERİRKEN HESAPLAYIP GÖNDERME İŞLEMİ
tourSchema.virtual("discountedPrice").get(function () {
  return this.price - this.priceDiscount;
});

tourSchema.virtual("slug").get(function () {
  return this.name.toLowerCase().split(" ").join("-");
});

//! Document Middleware
//Bir belgenin kaydedilme, güncelleme, silme, okunma, gibi olaylarından önce vey asonra işlme gerçekleştirmek istiyorsak kullanırız.

//örn: Client tan gelen tur verisinin veritabanına gönderilmemedennönce

tourSchema.pre("save", function (next) {
  this.durationHour = this.duration * 24;

  next();
});

tourSchema.post("updateOne", function (doc, next) {
  //kullanıcının şifresinini güncelleme işleminden sonra haber veya doğrulama gönderme işlemi
  console.log(doc._id, "Şifreniz güncellendi maili gönderildi...");
  next();
});

//!Query Middleware
//Sorgulardan önce veya sonra çalıştıracağımız middleware'lerdir.
tourSchema.pre("find", function (next) {
  //premium olanları her kullanıcıya göndermek istemediğimizden yapılan sorgularda otomatik olarak premium olmayanları filtreleyelim
  this.find({ premium: { $ne: true } });

  next();
});

tourSchema.pre(/^find/, function (next) {
  // yapılan tour isteklerinde guides ların sadece idleri gittiği için populate ile onlarında verilerinin alınması için oluşturduğumuz bir istektir
  this.populate({
    path: "guides reviews",
    select: "-password -__v -passResetToken -passResetExpires -passChangeAt",
  });
  next();
});

//! Aggregate Middleware
tourSchema.pre("aggregate", function (next) {
  this.pipeline().push({
    $match: {
      premium: { $ne: true },
    },
  });

  next();
});

tourSchema.index({ price: 1 });

tourSchema.index({ startLocation: "2dsphere" });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
