// asekron durumlarında hatayı yakalayan bir fonksiyon yazalım

module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
