import User from "../Models/UserMd.js";

const isLogin = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "You need to be logged in",
      });
    }

    const user = await User.findById(req.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account is inactive or does not exist",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};

export default isLogin;
