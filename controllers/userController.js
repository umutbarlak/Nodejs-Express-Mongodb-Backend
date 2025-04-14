const c = require("../utils/catchAsync");
const filterObject = require("../utils/filterObject");
const e = require("../utils/error");
const User = require("../models/userModel");
const factory = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");

// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/img/users");
//   },

//   filename: function (req, file, cb) {
//     const ext = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   },
// });

// fotoğraf dışında veri kabul etmeyen mw

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("Dosya tipi sadece resim olabilir (jpg,jpeg,png,webp..)"));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

// kullanıcının yükleyeceği fotoğraf özelliklerini belirleme
exports.resize = (req, res, next) => {
  if (!req.file) return next();

  // işlenmiş dosyanın ismini
  const filename = `user-${req.user.id}-${Date.now()}.webp`;

  sharp(req.file.buffer)
    .resize(400, 400)
    .toFormat("webp")
    .webp({ quality: 70 })
    .toFile(`public/img/users/${filename}`);

  next();
};

// dosyalara erişecek mw
exports.uploadUserPhoto = upload.single("avatar");

//hesap bilgilerini güncelle
exports.updateMe = c(async (req, res, next) => {
  // şifreyi güncellemeye çalışırsa hata ver
  if (req.body.password || req.body.passwordConfirm)
    return next(e(400, "Şifreyi bu endpoint ile güncelleyemezsiniz"));

  // isteğin body kısmından sadece izin verilen dğerleri al
  const filteredBody = filterObject(req.body, ["name", "email"]);

  // eğer istedğin içeriisnde avatar varsa güncellenecek alan verilerin arasına avatarı ekle
  if (req.file) filteredBody.photo = req.file.filename;

  //kullanıcı bilgilerini güncelle
  const updated = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
  });
  // client'a cevap ver
  res
    .status(200)
    .json({ message: "Bilgileriniz başarıyla güncellendi", updated });
});

exports.deleteMe = c(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(200).json({ message: "Hesabınız başarı ile kaldırıldı" });
});

exports.getAllUsers = factory.getAll(User);
exports.createUser = factory.createOne(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
