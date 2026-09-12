import { NextFunction, Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { register, login, refresh, logout } from "../controllers/authController";
import { AuthenticatedRequest, requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Please enter your full name."),
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters.")
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: errors.array()[0].msg,
          errors: errors.array()
        });
      }
      return await register(req, res, next);
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  "/login",
  [
    body("email")
      .trim()
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Please enter your password.")
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: errors.array()[0].msg,
          errors: errors.array()
        });
      }
      return await login(req, res, next);
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  "/refresh",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hasCookie = Boolean(req.cookies?.refreshToken);
      const hasBody = Boolean(req.body?.refreshToken && typeof req.body.refreshToken === "string" && req.body.refreshToken.trim());
      const hasHeader = Boolean(req.header("x-refresh-token"));

      if (!hasCookie && !hasBody && !hasHeader) {
        return res.status(400).json({
          message: "Refresh token is required.",
          code: "REFRESH_TOKEN_REQUIRED"
        });
      }

      return await refresh(req, res, next);
    } catch (err) {
      return next(err);
    }
  }
);


router.post("/logout", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    return await logout(req, res, next);
  } catch (err) {
    return next(err);
  }
});

router.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

export default router;
