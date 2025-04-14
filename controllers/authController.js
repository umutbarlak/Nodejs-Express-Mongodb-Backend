const User = require("../models/userModel.js");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const e = require("../utils/error.js");
const sendMail = require("../utils/sendMail.js");
const c = require("../utils/catchAsync.js");

const signToken = (user_id) => {
  return jwt.sign({ id: user_id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXP,
  });
};

const createSendToken = (user, code, res) => {
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(Date.now() + 90 * 24 * 60 * 1000),
    httpOnly: true,
    //secure: true // true olunca sadace https protokolündeki domainlerde seyahat eder
  });
  user.password = undefined;
  res.status(code).json({
    message: "Oturum açıldı",
    user,
    token,
  });
};

exports.singUp = c(async (req, res) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

exports.login = c(async (req, res, next) => {
  const { email, password } = req.body;
  //1 email ve şifre geldimi
  if (!email || !password) {
    return next(e(400, "Lütfen email ve şifer giriniz"));
  }

  //2 bu bilgilerle ait kayıtlı kullnacı var mı
  const user = await User.findOne({ email });

  //2.1 kullanıcu yokse hata fırlat
  if (!user) {
    return next(e(404, "Girdiğinşiz bilgilere ait kullanıcı yok"));
  }

  //3 client'tan gelen şifre veritabanında saklanan hashlenmiş şifre ile eşleşiyor mu kontrol et
  const isValid = await user.correctPass(password, user.password);

  //3.1 şifre yanlış ise hata fırlat
  if (!isValid) {
    return next(e(403, "Girdiğiniz şifre geçersiz"));
  }

  // hesap aktif mi kontrol et
  if (!user.active)
    return next(e(403, "Hesabınız inaktif.Bu hesaba giriş yapamazsınız"));
  // doğru ise jwt toekn oluştur gönder
  createSendToken(user, 201, res);
});

exports.loguot = (req, res) => {
  res.clearCookie("jwt").status(200).json({ message: "Oturumunuz kapatıldı" });
};

///----------Authorization MW---------

exports.protect = async (req, res, next) => {
  //1 gelen token'i al
  let token = req.cookies.jwt || req.headers.authorization;

  if (token && token.startsWith("Bearer")) {
    token = token.split(" ")[1];
  }
  //2 token gelmeddiyse hata fırlat
  if (!token) {
    return next(e(403, "Bu işlem için yetkiniz yok (jwt gönderilmedi)"));
  }
  //3 token'in geçerliliğini doğrula (zaman aşımına uğradımı / imza doğrumu)
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.message === "jwt expired") {
      return next(e(403, "Oturumunuzun süresi doldu"));
    }
    console.log(error);
    next(e(403, "Gönderilen token geçersiz"));
  }

  // 4 token ile gelen kullanıcının hesabı duruyor mu
  let activeUser;
  try {
    activeUser = await User.findById(decoded.id);
  } catch (error) {
    next(e(403, "Gönderilen token geçersiz"));
  }

  // 4.1 hesap  durmuyorsa
  if (!activeUser) {
    return next(e(403, "Kullanıcının hesabına erişilemiyor (tekrar kaydolun)"));
  }

  // 4.2 hesap duruyor amam dondurulmuşsa
  if (!activeUser?.active) {
    return next(e(403, "Kullanıcının hesabı dondurulmuş"));
  }

  // 5 tokeni verdikten sonra şifresini değişmiş mi

  if (activeUser?.passChangedAt && decoded.iat) {
    const passChangedSeconds = parseInt(
      activeUser.passChangedAt.getTime() / 1000
    );
    if (passChangedSeconds > decoded.iat) {
      return next(
        e(
          403,
          "Yakın zamanda şifrenizi değiştirdiniz. Lütfen tekrar giriş yapınız"
        )
      );
    }
  }

  req.user = activeUser;

  next();
};

// belirli roldeki kullanıcıların route' izin verirken diğerlerinin erişini engelleyen mw

exports.restricTo =
  (...roles) =>
  (req, res, next) => {
    /// iizn verilen roller arasında
    if (!roles.includes(req.user.role)) {
      return next(e(403, "Bu işlem için yetkiniz yok (rolünüz yetersiz)"));
    }

    // kullanıcının rolü yeterliyse
    next();
  };

//-------Şifremi Unuttum--------

// e-postaya şifre yenileme bağlantısı gönder
exports.forgotPassword = c(async (req, res, next) => {
  // 1 e-postaya göre kullanıcı hesabına eriş
  const user = await User.findOne({ email: req.body.email });

  // 1.2 kullanıcı yoksa hata gönder
  if (!user) {
    return next(e(404, "Bu mail adresine kayıtlı kullanıcı yok"));
  }
  // 2 şifre sıfırlama tokeni oluştur
  const resetToken = user.createResetToken();

  // 3 veritabanında haslanmşl olarak sakla
  await user.save({ validateBeforeSave: false });
  // 4 kullanıcınınn mail adresine tokeni link olrak gönder
  const url = `${req.protocol}://${req.headers.host}/api/users/reset-password/${resetToken}`;

  await sendMail({
    email: user.email,
    subject: "Şifre sıfırlama bağlantısı (10dk)",
    text: resetToken,
    html: `
    <h2>Merhaba ${user.name}</h2>
    <p><b>${user.email}</b> eposta adresine bağlı tourify hesabınız için şifre sıfırlama bağlantısı aşağıdadır</p>
    <a href="${url}">${url}</a>
    <p>Yeni şifre ile birlikte yukarıdaki bağlantıya <i>PATCH</i> isteği atınız</p>
    <p><b><i>Tourfy Ekibi</i></b></p>
    `,
  });

  res.status(200).json({ message: "e-posta gönderildi" });
});

exports.resetPassword = c(async (req, res, next) => {
  // token istekten al
  const token = req.params.token;
  // 1 tokenden yola çıkarak kullanıcıyı bul
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    passResetToken: hashedToken,
    passResetExpires: { $gt: Date.now() },
  });

  // 2 kullanıcı yoksa
  if (!user) {
    return next(e(403, "Token'ın süresi dolmuş veya geçersiz"));
  }
  // 2 kullanıcı bulunduysa ve token geçerliyse yeni şifreyi belirle
  user.password = req.body.newPass;
  user.passwordConfirm = req.body.newPass;
  user.passResetToken = undefined;
  user.passResetExpires = undefined;
  // 4 kullanıcının şifre değiştirme tarihini güncelle

  await user.save();

  res.status(200).json({ message: "Şifreniz başarıyla güncellendi" });
});

//-------Şifremi Değiştirmek İstiyorum--------
// kullanıcı şifresini biliyor ve güncellemek istiyorsa

exports.updatePassword = c(async (req, res, next) => {
  // kullanıcı bilgilerini al
  const user = await User.findById(req.user.id);
  // gelşen mevcut şifre duğru mu kontorl et
  if (!(await user.correctPass(req.body.currentPass, user.password)))
    return next(e(400, "Girdiğiniz mevcut şifre hatalı"));
  // doğruysa yeni şifreyi kaydet
  user.password = req.body.newPass;
  user.passwordConfirm = req.body.newPass;

  await user.save();

  // bilgilendirme maili gönder

  await sendMail({
    email: user.email,
    subject: "Tourify Hesanı Şifreniz Güncellendi",
    text: "Bilgilendirme Maili",
    html: `
    <h1>Şifre Değişikliği Başarılı</h1>
    <p>Merhaba <strong>${user.name}</strong>,</p>
    <p>Hesabınızın şifresi başarıyla değiştirilmiştir. Hesabınızın güvenliğini önemsiyoruz ve bu işlemle ilgili bilgilendirme yapmak istedik.</p>
    <p><strong>Şifre değişikliği işlemi size ait değilse:</strong></p>
    <p>Lütfen hemen bizimle iletişime geçin ve hesabınızın güvenliğini sağlamak için adımlar atmamıza yardımcı olun.</p>
    <p><strong>Hesap Güvenliği İçin Öneriler:</strong></p>
    <ul>
        <li>Şifrenizi kimseyle paylaşmayın.</li>
        <li>Güçlü ve benzersiz bir şifre kullanın.</li>
        <li>İki faktörlü kimlik doğrulamayı (2FA) etkinleştirin.</li>
    </ul>
    <p>Herhangi bir sorunuz olursa, bizimle iletişime geçmekten çekinmeyin.</p>
    <p>Teşekkürler,</p>
    <p><strong>Tourify Destek Ekibi</strong></p>
    `,
  });

  // (opsiyonel) tekrar giriş yapmaması için
  createSendToken(user, 200, res);
});
