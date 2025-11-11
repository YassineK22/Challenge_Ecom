const {
  User,
  Buyer,
  Admin,
} = require("../models/User");
const e = require("../utils/error");

module.exports = {
  signout: (req, res, next) => {
    try {
      res
        .clearCookie("access_token", { path: "/" })
        .status(200)
        .json("User has been signed out");
    } catch (error) {
      next(error);
    }
  },

  // New method to get user by ID
  getUserById: async (req, res, next) => {
    const { id } = req.params;

    try {
      const user = await User.findById(id);
      if (!user) {
        return next(e.errorHandler(404, "User not found"));
      }

      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      const userId = req.params.id;
      const { name, email, phoneNumber, address } =
        req.body;

      // Find user by ID
      const user = await User.findById(userId);
      if (!user) {
        return next(e.errorHandler(404, "User not found"));
      }

      // Update fields based on role
      if (user.role === "buyer") {
        if (name) user.name = name;
        if (email) user.email = email;
        if (phoneNumber) user.phoneNumber = phoneNumber;
        if (address) user.address = address;
      } else if (user.role === "admin") {
        if (name) user.name = name;
        if (email) user.email = email;
      }

      // Save updated user
      await user.save();
      res.status(200).json({ message: "Profile updated successfully" });
    } catch (error) {
      next(error);
    }
  },
  getUsers: async (req, res, next) => {
    try {
      let { page = 1, limit = 10, role } = req.query;
      page = parseInt(page);
      limit = parseInt(limit);

      // Build query object
      const query = {};
      if (role) {
        query.role = role;
      }

      const totalUsers = await User.countDocuments(query);
      const users = await User.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 });

      const from = (page - 1) * limit + 1;
      const to = Math.min(from + users.length - 1, totalUsers);

      res.status(200).json({
        users,
        total: totalUsers,
        page,
        limit,
        showing: `${from} - ${to} of ${totalUsers} users`,
      });
    } catch (error) {
      next(error);
    }
  },

  getDashboardStats: async (req, res, next) => {
    try {
      const totalUsers = await User.countDocuments({});
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const newUsers = await User.countDocuments({
        createdAt: { $gte: oneWeekAgo },
      });

      const revenue = 12500;

      res.status(200).json({
        totalUsers,
        revenue,
        newUsers,
      });
    } catch (error) {
      next(error);
    }
  },

};
