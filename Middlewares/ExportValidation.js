
import { validationResult } from "express-validator";
import { HandleERROR } from "vanta-api";

const exportValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HandleERROR(errors.array()[0].msg, 400)
    );
  }

  next();
};

export default exportValidation;
