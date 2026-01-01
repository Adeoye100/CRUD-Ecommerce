const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../../helpers/firebase");

//register
const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (!snapshot.empty)
      return res.json({
        success: false,
        message: "User Already exists with the same email! Please try again",
      });

    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = {
      userName,
      email,
      password: hashPassword,
      role: "user", // Default role
      createdAt: new Date().toISOString(),
    };

    await usersRef.add(newUser);

    res.status(200).json({
      success: true,
      message: "Registration successful",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

//login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("email", "==", email).get();

    if (snapshot.empty)
      return res.json({
        success: false,
        message: "User doesn't exists! Please register first",
      });

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const checkPasswordMatch = await bcrypt.compare(
      password,
      userData.password
    );
    if (!checkPasswordMatch)
      return res.json({
        success: false,
        message: "Incorrect password! Please try again",
      });

    const token = jwt.sign(
      {
        id: userDoc.id,
        role: userData.role,
        email: userData.email,
        userName: userData.userName,
      },
      "CLIENT_SECRET_KEY",
      { expiresIn: "60m" }
    );

    res.cookie("token", token, { httpOnly: true, secure: false }).json({
      success: true,
      message: "Logged in successfully",
      user: {
        email: userData.email,
        role: userData.role,
        id: userDoc.id,
        userName: userData.userName,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Some error occured",
    });
  }
};

//logout

const logoutUser = (req, res) => {
  res.clearCookie("token").json({
    success: true,
    message: "Logged out successfully!",
  });
};

//auth middleware
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });

  try {
    const decoded = jwt.verify(token, "CLIENT_SECRET_KEY");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });
  }
};

module.exports = { registerUser, loginUser, logoutUser, authMiddleware };
