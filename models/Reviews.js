const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  title: {
    type: String,
    unique: true,
    trim: true, // trim is used to ensure that there are no white spaces in the stringlike : " name"
    required: [true, "Please add a  title for review"],
    maxLength: 100,
  },
  text: {
    type: String,
    required: [true, "Please add some text"],
  },
  rating: {
    type: Number,
    min: 1,
    max: 10,
    required: [true, "Please add rating on a scale of 10"],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId, // when we create a document it creates an ID we are using it as a type for bootcamp
    ref: "Bootcamp", // it is used to refer which model to use we are also connecting it to the bootcamp
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId, // when we create a document it creates an ID we are using it as a type for bootcamp
    ref: "User",
    required: true,
  },
});

// -----------  keep in  mind the following ---------- //
// Static is gonna be directly on the model, method is gonna be  whatever you create from the model. Example:
// Note:-   Course is the model here

// Course.goFish()  {this static coz its being directly called on the model} ,

// const courses= Course.find();

// courses.goFish(); { this is method because courses is created from the model }

//  Static method to get average rating andn save

ReviewSchema.statics.getAverageRating = async function (bootcampId) {
  const obj = await this.aggregate([
    // creating aggregate object
    {
      $match: { bootcamp: bootcampId },
    },
    {
      $group: {
        // the object which we are gonna create includes:-
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" }, // we just define here of which field we wanna take avg of
      },
    },
  ]);

  try {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampId, {
      averageRating: obj[0].averageRating,
    });
  } catch (err) {
    console.error(err);
  }

  console.log("created obj", obj); // this object mus contain the bootcamp id as well as the avg tuition cost
};

// Call getAverageRating after saving
ReviewSchema.post("save", function () {
  // we are calling it after saving new course then it will update the average cost
  this.constructor.getAverageRating(this.bootcamp);
});

// Call getAverageRating before remove
ReviewSchema.pre("remove", function () {
  // we are calling it before removing course then it will update the average cost
  this.constructor.getAverageRating(this.bootcamp);
});


module.exports = mongoose.model("Review", ReviewSchema);
