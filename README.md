# 🧭 MongoDB API Server

Bu proje, Express.js ve MongoDB (Mongoose) kullanılarak geliştirilmiş bir RESTful API sunucusudur. Tur, kullanıcı ve yorum işlemlerini destekler. Güvenlik, hata yönetimi ve performans optimizasyonları için çeşitli middleware’ler entegre edilmiştir.

## 📁 Proje Yapısı

```
├── controllers/
│   ├── authController.js
│   ├── handlerFactory.js
│   ├── reviewController.js
│   ├── tourController.js
│   └── userController.js
│
├── middleware/
│   └── formatQuery.js
│
├── models/
│   ├── reviewModel.js
│   ├── tourModel.js
│   └── userModel.js
│
├── public/
│   └── img/
│       └── users/
│
├── routes/
│   ├── reviewRoutes.js
│   ├── tourRoutes.js
│   └── userRoutes.js
│
├── utils/
│   ├── apiFeatures.js
│   ├── catchAsync.js
│   ├── error.js
│   ├── filterObject.js
│   └── sendMail.js
│
├── app.js
└── server.js
```

### 1. Ortam Değişkenlerini Ayarla

Ana dizine `.env` dosyası oluştur ve aşağıdaki gibi düzenle:

```env
PORT=3000
MONGO_URL=your-mongodb-uri
JWT_SECRET=your-secret
JWT_EXP=90d
MAIL_USER=your-email
MAIL_PASS=your-password

```

## 🛠️ API Endpoint'leri

### 🔐 Auth

- `POST /api/users/signup`
- `POST /api/users/login`
- `POST /api/users/logout`
- `POST /api/users/forgot-password`
- `PATCH /api/users/reset-password/:token`
- `PATCH /api/users/update-password`

### 👤 Kullanıcı

- `PATCH /api/users/update-me`
- `DELETE /api/users/delete-me`
- `GET /api/users/` _(Sadece admin)_
- `POST /api/users/` _(Sadece admin)_
- `GET/PUT/DELETE /api/users/:id` _(Sadece admin)_

### 🗺️ Turlar

- `GET /api/tours/`
- `GET /api/tours/top-tours`
- `GET /api/tours/tour-stats`
- `GET /api/tours/monthly-plan/:year`
- `GET /api/tours/:id`
- `POST /api/tours/` _(admin, lead-guide)_
- `PATCH /api/tours/:id` _(admin, guide, lead-guide)_
- `DELETE /api/tours/:id` _(admin, lead-guide)_
- `GET /api/tours/tours-within/:distance/center/:latlng/unit/:unit`
- `GET /api/tours/distances/:latlng/unit/:unit`

### 📝 Yorumlar

- `GET /api/reviews/`
- `POST /api/reviews/`
- `GET/PATCH/DELETE /api/reviews/:id`
- `POST /api/tours/:tourId/reviews` _(Tour'a yorum ekler)_

## 🔐 Güvenlik Middleware'leri

- `helmet` → HTTP header güvenliği
- `express-rate-limit` → DDoS ve brute-force koruması
- `express-mongo-sanitize` → NoSQL Injection önleme
- `hpp` → HTTP parametre kirliliği önleme
- `cookie-parser` → Çerez işlemleri
- `express.json()` → JSON body parsing ve boyut sınırı (10kb)

## 🧩 Utilities

- `apiFeatures.js` → Filtreleme, sıralama, limit, pagination
- `catchAsync.js` → Hata yakalama wrapper
- `error.js` → Custom hata oluşturucu

## ✉️ Email Desteği

- Şifre sıfırlama işlemleri için `nodemailer` kullanılır.
- SMTP ayarları `.env` dosyasına eklenmelidir.

## 📸 Kullanıcı Fotoğrafları

- Kullanıcılar fotoğraf yükleyebilir (uploadUserPhoto, resize middleware).
- `multer` ve `sharp` ile işlenir.

## 📌 Notlar

- `CommonJS` modül yapısı kullanılmıştır (`type: "commonjs"`).
- API'de global error handler mevcuttur.
- Geliştirme için `nodemon` kullanılır.
