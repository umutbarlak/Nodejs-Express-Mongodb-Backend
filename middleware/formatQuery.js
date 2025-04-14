module.exports = (req, res, next) => {
  let queryObj = { ...req.query };

  const fields = ["limit", "page", "fields", "sort"];
  fields.forEach((el) => delete queryObj[el]);

  let queryStr = JSON.stringify(queryObj);

  queryStr = queryStr.replace(
    /\b(eq|gt|gte|lte|lt|ne)\b/g,
    (found) => `$${found}`
  );

  req.formattedQuery = JSON.parse(queryStr);

  next();
};
