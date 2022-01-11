const express = require("express");
const dotenv = require("dotenv");
const logger = require("./middleware/logger");
const morgan = require("morgan");
const colors = require("colors");
const fileupload = require("express-fileupload");
const errorHandler = require("./middleware/error");
const connectDB = require("./config/db");
const path = require("path");
const cookieParser = require("cookie-parser");
// Load env vars
dotenv.config({ path: "./config/config.env" });

// Connect to Database
connectDB();

// Route files
const bootcamps = require("./routes/bootcamps");
const courses = require("./routes/courses");
const users = require("./routes/users");
const auth = require("./routes/auth");
const reviews = require("./routes/reviews");

const app = express();

// Body parser
app.use(express.json()); // it will allow us to use req.body

// cookie parser
app.use(cookieParser());
// calling middleware

app.use(logger); //custom middleware

// Dev logging middleware

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); //3rd party middleware
}

// File uploading
app.use(fileupload());

// set static folder
app.use(express.static(path.join(__dirname, "public")));

// Mount routers
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);
app.use("/api/v1/auth", auth);

const PORT = process.env.PORT || 5000;

// Error handler (it must be placed after routers)
app.use(errorHandler);

const server = app.listen(
  PORT,
  console.log(
    `Server running on port ${process.env.NODE_ENV} mode on port ${PORT}`.yellow
  )
);

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`.red);

  //Close server & exit process
  server.close(() => process.exit(1));
});
