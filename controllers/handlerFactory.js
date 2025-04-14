const APIFeatures = require("../utils/apiFeatures");
const c = require("../utils/catchAsync");

exports.deleteOne = (Model) =>
  c(async (req, res, next) => {
    await Model.findByIdAndDelete(req.params.id);

    res.status(204).json({});
  });

exports.updateOne = (Model) =>
  c(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json({
      message: "Belge başarıyla güncellendi",
      data: document,
    });
  });

exports.createOne = (Model) =>
  c(async (req, res, next) => {
    const newDocument = await Model.create(req.body);

    res.status(201).json({
      message: "Belge başarıyla oluştu",
      data: newDocument,
    });
  });

exports.getOne = (Model) =>
  c(async (req, res, next) => {
    const document = await Model.findById(req.params.id);
    res.status(200).json({
      message: "Belge başarıyla alındı",
      data: document,
    });
  });

exports.getAll = (Model) =>
  c(async (req, res, next) => {
    let filters;

    if (req.params.tourId) filters = { tour: req.params.tourId };
    const features = new APIFeatures(
      Model.find(filters),
      req.query,
      req.formattedQuery
    )
      .filter()
      .limit()
      .sort()
      .pagination();

    const documents = await features.query;

    res.json({
      text: "Belgeler başarı ile alındı",
      result: documents.length,
      data: documents,
    });
  });
