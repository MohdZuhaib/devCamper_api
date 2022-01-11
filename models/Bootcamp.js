const mongoose = require("mongoose");
const slugify = require("slugify");
const geocoder = require("../utils/geocoder");
const BootcampSchema = new mongoose.Schema(
  {
    // validations

    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true, // Multiple bootcamps cannot have the same name
      trim: true, //for trimming whitespaces
      maxLength: [50, "Name can`t be more than 50 characters"],
    },

    slug: String, //URL friendly version for name,
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxLength: [500, "Description can`t be more than 500 characters"],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/,
        "Please use a valid URL with HTTP or HTTPS",
      ],
    },
    phone: {
      type: String,
      maxLength: [20, "Phone number can not be longer than 10 digits"],
    },
    email: {
      type: String,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        "Please add valid email address",
      ],
    },

    address: {
      type: String,
      required: [true, "Please add an address"],
    },

    location: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ["Point"], // 'location.type' must be 'Point'
        //   required: true,
      },
      coordinates: {
        type: [Number],
        //   required: true,
        index: "2dsphere",
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      //Array of strings
      type: [String],
      required: true,
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX",
        "Data Science",
        "Business",
        "Other",
      ],
    },
    averageRating: {
      type: Number,
      min: [1, "Rating must be atleast 1"],
      max: [10, "Rating can not be mmore than 10"],
    },

    averageCost: Number,

    photo: {
      type: String, //It`s gonna be name of the file in database
      default: "no-photo.jpg",
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGaurantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    courses: {
      type: mongoose.Schema.ObjectId, // when we create a document it creates an ID we are using it as a type for bootcamp
      ref: "Course", // it is used to refer which model to use we are also connecting it to the user
     
    },
    user: {
      type: mongoose.Schema.ObjectId, // when we create a document it creates an ID we are using it as a type for bootcamp
      ref: "User", // it is used to refer which model to use we are also connecting it to the user
      required: true,
    },
    reviews: {
      type: mongoose.Schema.ObjectId, // when we create a document it creates an ID we are using it as a type for bootcamp
      ref: "Review", // it is used to refer which model to use we are also connecting it to the user
    },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Create bootcamp slug from the name
BootcampSchema.pre("save", function (next) {
  // we are using regular function because of diff scoping than arrow fn
  console.log("Slugify ran", this.name, { lower: true }); // read the docs for more info on these functions
  next();
});

// Geocode & create location field
BootcampSchema.pre("save", async function (next) {
  const loc = await geocoder.geocode(this.address);
  this.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countryCode,
  };

  // Do not add address in DB  so that we dont have complete messin the db
  this.address = undefined;
  next();
});

// Cascade delete courses when a bootcamp is deleted
BootcampSchema.pre("remove", async function (next) {
  console.log(`Courses being removed from ${this._id}`); // this wont work if we use findbyid and delete
  await this.model("Course").deleteMany({ bootcamp: this._id });
  next();
});


module.exports = mongoose.model("Bootcamp", BootcampSchema);
