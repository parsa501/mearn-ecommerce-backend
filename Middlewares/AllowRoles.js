const allowRoles = (...roles) => {
  return (req, res, next) => {
    const role = roles.find((item) => item === req.user.role);

    if (!role) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to access this route",
      });
    }

    next();
  };
};

export default allowRoles;
