const mongoose = require("mongoose");
const colors=require('colors')
const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    //its gonna return promise thats why we are using async await
    useNewUrlParser: true,
    // useCreateIndex: true,
    // useFindAndModify: true,
  });

  console.log(`MongoDB connected: ${conn.connection.host}`.cyan.underline);
};

module.exports=connectDB;