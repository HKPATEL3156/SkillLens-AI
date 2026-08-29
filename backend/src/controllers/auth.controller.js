// import model
const User = require("../models/User"); // user model
const bcrypt = require("bcryptjs"); // password hash
const jwt = require("jsonwebtoken"); // jwt token

// register controller
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body; // get data

    const exist = await User.findOne({ email }); // check email
    if (exist) return res.status(400).json({ message: "user already exists" });

    const hash = await bcrypt.hash(password, 10); // hash password

    const user = await User.create({ fullName: name, email, password: hash }); // save user

    res.json({ message: "register success" }); // response
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};

// login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body; // get data

    const user = await User.findOne({ email }).select("+password"); // find user (include password)
    if (!user) return res.status(400).json({ message: "invalid email" });

    const match = await bcrypt.compare(password, user.password); // compare pass
    if (!match) return res.status(400).json({ message: "invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    }); // create token

    res.json({ token }); // return token
  } catch (err) {
    res.status(500).json({ message: "server error" });
  }
};
