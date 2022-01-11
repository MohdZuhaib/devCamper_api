const path = require("path");
const ErrorResponse = require("../utils/errorResponse");
const geocoder = require("../utils/geocoder");
const Bootcamp = require("../models/Bootcamp");
const asyncHandler = require("../middleware/async");
//@desc    Get all bootcamps
//@route   GET /api/v1/bootcamps
//@access  Public
exports.getBootcamps = asyncHandler(
  async (req, res, next) => {
    console.log(req.query); // we can listen to queries like this
    // console.log("modded query", queryStr);
    res.status(200).json(res.advancedResults);
  }

  // res.status(200).json({
  //   success: true,
  //   hello: req.hello,
  // }); // this method is used to send data or a message on response even hough its a 400 request
);

//@desc    Get single bootcamp
//@route   GET /api/v1/bootcamps/:id
//@access  Public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    // return res
    //   .status(400)
    //   .json({ success: false, message: "Bootcamp not found" });
    return next(
      new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404) // this will be fired when the id is formatted correctly but theres no bootcamp of such id in db
    );
  }
  res.status(200).json({
    success: true,
    data: bootcamp,
    message: `This is Bootcamp ${bootcamp.name}`,
  }); //:id will allow to add variable value
});

//@desc    Create bootcamp
//@route   POST /api/v1/bootcamps
//@access  Private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
  // Add user to req.body  which will later be used to verify the owner of the bootcamp
  req.body.user = req.user.id;

  // Check for published bootcamp
  const publishedBootcamp = await Bootcamp.findOne({ user: req.user.id }); //this will find courses published by the user

  // If the user is not admin, they can only add one bootcamp
  if (publishedBootcamp && req.user.role !== "admin") {
    return next(new ErrorResponse("You cannot add more bootcamps", 400));
  }

  const bootcamp = await Bootcamp.create(req.body);
  res
    .status(201)
    .json({ success: true, message: "Created new bootcamp", data: bootcamp });
});
//@desc    Update  bootcamps
//@route   PUT /api/v1/bootcamps/:id
//@access  Private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return res
      .status(400)
      .json({ success: false, message: "Bootcamp not found" });
  }

  // Make sure user is the owner of the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    // coz admin will still be able to update the bootcamp
    return next(
      new ErrorResponse("You are not authorized to update the bootcamp", 401)
    );
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res
    .status(200)
    .json({ success: true, message: `Updated bootcamp`, data: bootcamp });
});

//@desc    Delete  bootcamp
//@route   DELETE /api/v1/bootcamps/:id
//@access  Private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404) // this will be fired when the id is formatted correctly but theres no bootcamp of such id in db
    );
  } else {
    // Make sure user is the owner of the bootcamp
    if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
      // coz admin will still be able to update the bootcamp
      return next(
        new ErrorResponse("You are not authorized to delete this bootcamp", 401)
      );
    }
    bootcamp.remove();
    res
      .status(200)
      .json({ success: true, message: `Successfully deleted bootcamp ` });
  }
});

// app.get("/", (req, res) => {
//   // res.sendStatus(400)
//   res.status(200).json({ success: true, data: { id: "43" } });
//   res.send("<h1>hello from other side<h1>");
// });

//@desc    Get bootcamp within a radius
//@route   GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access  Private

exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  //  Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide dist by radius of Earth
  // Earth Radius= 3,963 mi / 6,378 KM

  const radius = distance / 3963; // basically radius for bootcamp

  const bootcamps = await Bootcamp.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

//@desc    Upload photo for bootcamp
//@route   PUT  /api/v1/bootcamps/:id/photo
//@access  Private
exports.bootcampPhotoUpload = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp not found with id ${req.params.id}`, 404) // this will be fired when the id is formatted correctly but theres no bootcamp of such id in db
    );
  }
  // Make sure user is the owner of the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    // coz admin will still be able to update the bootcamp
    return next(
      new ErrorResponse("You are not authorized to delete this bootcamp", 401)
    );
  }
  if (!req.files) {
    return next(
      new ErrorResponse(`Please upload a file`, 400) // this will be fired when the id is formatted correctly but theres no bootcamp of such id in db
    );
  }

  const file = req.files.file;

  if (!file.mimetype.startsWith("image")) {
    return next(new ErrorResponse(`Please upload an image`, 400));
  }

  if (!file.size > process.env.MAX_FILE_UPLOAD) {
    return next(
      new ErrorResponse(
        `Image size must be less than ${process.env.MAX_FILE_UPLOAD}`,
        400
      )
    );
  } else console.log(req.file);

  // Create custom file name
  file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;

  file.mv(`${process.env.FILE_UPLOAD_PATH}/${file.name}`, async (err) => {
    if (err) {
      console.log(err);
      return next(new ErrorResponse("Problem with file upload", 500));
    }

    await Bootcamp.findByIdAndUpdate(req.params.id, { photo: file.name });
    res.status(200).json({
      success: true,
      data: file.name,
    });
  });
  console.log(file.name);
});

// ----------------------  radius not working-------------------
