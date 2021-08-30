require("dotenv").config();

const express = require("express");
const authRoutes = require("./routes/auth");
const privateRoutes = require("./routes/private");
const connectDB = require("./config/db");
const errorHandler = require("./middlewares/error");

connectDB();
const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/private", privateRoutes);

// ErrorHandler middleware should be at last
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => console.log(`Running on port ${PORT}`));

process.on("unhandledRejection", (err, promise) => {
  console.log(`Logged Error: ${err}`);
  server.close(() => process.exit(1));
});
