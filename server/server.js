const express = require("express");
const app = express();
const cors = require("cors");

require("dotenv").config();
require("./config/mongoose");

const port = process.env.PORT || 8000;

// CORS configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    
    credentials: true,
  })
);

app.use(express.json());

// Routes
require("./routes/Admin.routes")(app);
require("./routes/User.routes")(app);
require("./routes/Auth.routes")(app);

const AdminRoutes = require("./routes/Admin.routes");
const UserRoutes = require("./routes/User.routes");
const AuthRoutes = require("./routes/Auth.routes");

app.use("/api/admin", AdminRoutes);
app.use("/api/user", UserRoutes);
app.use("/api/auth", AuthRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

// Start the server
app.listen(port, () => console.log(`🚀 Server running on port: ${port}`));