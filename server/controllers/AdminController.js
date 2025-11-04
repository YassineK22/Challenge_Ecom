const {User } = require("../models/User");

exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or not eligible for deletion" });
    }

    await User.findByIdAndDelete(userId);

    res.json({ message: "User deleted successfully", userId });
  } catch (error) {
    next(error);
  }
};

exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { action } = req.body; // 'activate' or 'deactivate'

    if (!["activate", "deactivate"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Invalid action. Use 'activate' or 'deactivate'" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isActive = action === "activate";
    await user.save();

    res.json({
      message: `User account ${
        action === "activate" ? "activated" : "deactivated"
      } successfully`,
      userId: user._id,
      isActive: user.isActive,
    });
  } catch (error) {
    next(error);
  }
};
