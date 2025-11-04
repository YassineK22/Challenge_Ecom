const adminController = require("../controllers/AdminController");

module.exports = (app) => {
  app.delete("/delete/:userId", adminController.deleteUser),
  app.patch("/status/:userId", adminController.toggleUserStatus);
};
