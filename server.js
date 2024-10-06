require("dotenv").config();
const express = require("express");
const connectDB = require("./config/database");
const userRoutes = require("./routes/userRoutes");
const path = require("path");
const cors = require("cors");
const passport = require("./config/passport");
const app = express();

connectDB();

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/users", userRoutes);

app.use(passport.initialize());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
