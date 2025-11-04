const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["buyer", "admin"],
      default: "buyer",
    },
    profilePicture: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Number },
    approvalToken: { type: String },
    approvalTokenExpires: { type: Date },
    isActive: { type: Boolean, default: false },
  },
  { timestamps: true, discriminatorKey: "role" }
);

UserSchema.pre("save", function (next) {
  if (!this.password) {
    const error = new Error("Password is required for this role.");
    return next(error);
  }
  next();
});

const BuyerSchema = new mongoose.Schema({
  address: { type: String, default: "Not provided" },
  phoneNumber: { type: String, default: "Not provided" },
});

const AdminSchema = new mongoose.Schema({});

const User = mongoose.model("User", UserSchema);
const Buyer = User.discriminator("buyer", BuyerSchema);
const Admin = User.discriminator("admin", AdminSchema);

module.exports = { User, Buyer, Admin };
