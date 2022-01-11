const advancedResults = (model, populate) => async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude during filtering
  const removeFields = ["select", "sort", "page", "limit"];

  // ^^ Reason for doing above is initially reqQuery will have data as: select=name&sort=name , it  by default take the var (select and sort here) as key in the data but --
  //-- while finding the resources as per the code below inside the reqQuery it must contain the values only not the key like select, sort(basically functionality)

  // Loop over removeFields and delete them from reqQuery
  removeFields.forEach((param) => delete reqQuery[param]);

  console.log(reqQuery);
  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // let queryStr = JSON.stringify(req.query);

  // create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding resource
  query = model.find(JSON.parse(queryStr)).populate(populate);

  // Select Fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    console.log("splitted fields", fields);
    query = query.select(fields);
    // we are doing this because as per the official docs the format for select is select('name occupation'),
    //  but user will enter name, oocupation in query param so just to convrt it we are doing it
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination

  const page = parseInt(req.query.page, 10) || 1; // by default the page will be 1
  const limit = parseInt(req.query.limit, 10) || 25;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await model.countDocuments();

  query = query.skip(startIndex).limit(limit);

  if (populate) {
    query = query.populate(populate);
  }

  // Executing query
  const results = await query;

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.advancedResults = {
    success: true,
    count: results.length,
    pagination,
    data: results,
  };
  next();
};

module.exports = advancedResults;
