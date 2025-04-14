const mongoose = require("mongoose");
const app = require("./app.js");
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

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server ${port} port'unda çalışmaya başladı`);
});
