class APIFeatures {
  constructor(query, params, formattedParams) {
    this.query = query;
    this.params = params;
    this.formattedParams = formattedParams;
  }

  filter() {
    this.query = this.query.find(this.formattedParams);
    return this;
  }

  sort() {
    if (this.params.sort) {
      this.query.sort(this.params.sort.split(",").join(" "));
    } else {
      this.query.sort("-createdAt");
    }
    return this;
  }

  limit() {
    if (this.params.fields) {
      this.query.select(this.params.fields.split(",").join(" "));
    }
    return this;
  }

  pagination() {
    const page = Number(this.params.page) || 1;
    const limitCount = Number(this.params.limit) || 10;
    const skipCount = (page - 1) * limitCount;

    this.query.skip(skipCount).limit(limitCount);
    return this;
  }
}

module.exports = APIFeatures;
