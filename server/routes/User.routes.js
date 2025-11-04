const userController = require("../controllers/UserController");

module.exports = (app) => {
  app.post("/signout", userController.signout);
  app.put("/user/:id", userController.updateUser);
  app.get("/user/:id", userController.getUserById);
  app.get("/users", userController.getUsers);
  app.get("/dashboard/stats", userController.getDashboardStats);
};
