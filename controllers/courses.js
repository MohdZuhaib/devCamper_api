const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");
const Bootcamp = require("../models/Bootcamp");
const Course = require("../models/Course");

//@desc    Get courses
//@route   GET /api/v1/courses -----(route A)
//@route   GET /api/v1/bootcamps/:bootcampId/courses ----(route B)
//@access  Public

exports.getCourses = asyncHandler(async (req, res, next) => {
  if (req.params.bootcampId) {
    // this is for specific bootcamp courses
    const courses = await Course.find({ bootcamp: req.params.bootcampId }); // this will hit on the route B

    return res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } else {
    // this is for gettng all the courses

    res.status(200).json(res.advancedResults);

    // // query = course.find().populate('bootcamp'); // this will hit on the route A and populate will show the related bootcamp in the courses as well
    // query = Course.find().populate({
    //   path: "bootcamp",
    //   select: "name description",
    // }); // this will filter out the details of bootcamp to just name and description
  }

  // const courses = await query;
});

//@desc    Get single course
//@route   GET /api/v1/courses/:courseId
//@access  Public

exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!course) {
    return next(
      new ErrorResponse(`No course with id of ${req.params.id}`),
      404
    );
  }
  res.status(200).json({
    success: true,
    data: course,
  });
});

//@desc    Add course
//@route   POST /api/v1/bootcamps/:bootcampId/courses
//@access  Private

exports.addCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampId; //  we need to submit it as body field coz in our course model bootcamp is a field so we`re manually doing it
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampId);
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp not found with id of ${req.params.bootcampId}`
      )
    );
  }
  // Make sure user is the owner of the bootcamp
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    // coz admin will still be able to update the bootcamp
    return next(
      new ErrorResponse(
        "You are not authorized to add a course to this bootcamp",
        401
      )
    );
  }

  const course = await Course.create(req.body);
  res.status(200).json({
    success: true,
    data: course,
  });
});

//@desc    Update course
//@route   PUT /api/v1/courses/:id
//@access  Private

exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id); // Basically first we`ll try to confirm wether thers a course available or not

  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }
  // Make sure user is the owner of the bootcamp
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    // coz admin will still be able to update the bootcamp
    return next(
      new ErrorResponse("You are not authorized to update this course", 401)
    );
  }
  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    data: course,
  });
});

//@desc    Delete course
//@route   DELETE /api/v1/courses/:id
//@access  Private

exports.deleteCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);
  if (!course) {
    return next(
      new ErrorResponse(`Course not found with id of ${req.params.id}`, 404)
    );
  }
  // Make sure user is the owner of the bootcamp
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    // coz admin will still be able to update the bootcamp
    return next(
      new ErrorResponse("You are not authorized to delete this course", 401)
    );
  }
  await course.remove();
  res.status(200).json({
    success: true,
    message: `Course deleted successfully`,
    data: {},
  });
});
