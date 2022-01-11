// @desc Logs rerquest to console
const logger = (req, res, next) => {
  req.hello = "Hello Everyone";
  console.log(
    `${req.method} ${req.protocol}://${req.get("host")}${req.originalUrl}`
  );
  next();
};

module.exports = logger;
