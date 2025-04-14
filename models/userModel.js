const { Schema, model } = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Kullanıcı isim değerine sahip olmalı"],
    minLength: [3, "Kullanıcı ismi en az 3 karakter olabilir"],
    maxLength: [30, "Kullanıcı ismi en fazla 30 karakter olabilir"],
  },
  email: {
    type: String,
    required: [true, "Kullanıcı email değerine sahip olmalı"],
    unique: [true, "Bu e-posta kayıtlı kullanıcı zaten var"],
    validate: [validator.isEmail, "Lütfen geçerli bir mail giriniz"],
  },
  photo: {
    type: String,
    default: "defaultpic.webp",
  },
  password: {
    type: String,
    required: [true, "Kullanıcı şifreye sahip olmalı"],
    minLength: [8, "Şifre en az 6 karaktere sahip olmalı"],
    validate: [validator.isStrongPassword, "Şifreniz yeterince güçlü değil"],
  },
  passwordConfirm: {
    type: String,
    required: [true, "Lütfen şifrenizi onaylayın"],
    validate: {
      validator: function (value) {
        return this.password === value;
      },
      message: "Onay şifreniz eşleşmiyor",
    },
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  active: { type: Boolean, default: true },
  passChangedAt: Date,
  passResetToken: String,
  passResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

//? Veritabanına kullanıcyı güncellemeden önce
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  // şifre değiştiyse
  this.passChangedAt = Date.now() - 1000;

  next();
});

//? kullanıcı veritabanından alınmak istendiğinde active değeri true mu diye kontorl et değilse hata döndür

userSchema.pre(/^find/, function (next) {
  //yapılan sorgudan hesabı inactive olanları kaldır
  this.find({ active: { $ne: false } });
  next();
});

//?sadece Model üzerinden erişilebilen fonksison

userSchema.methods.correctPass = async function (password, hashPass) {
  return await bcrypt.compare(password, hashPass);
};

userSchema.methods.createResetToken = function () {
  // 1 32'byte alan kaplayan rastgele bir veri oluştur ve bunu hexadecimal bir diziye dönüştür
  const resetToken = crypto.randomBytes(32).toString("hex");

  // 2 tokeni hasle ve veri tabanına kaydet
  this.passResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // 3 tokenin son gçerlilik tarihini vertabanına kaydet (10dk)
  this.passResetExpires = Date.now() + 10 * 60 * 1000;
  // 4 tokenin normal halini return et
  return resetToken;
};

const User = model("User", userSchema);

module.exports = User;
