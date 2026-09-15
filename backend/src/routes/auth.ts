import { NextFunction, Request, Response, Router } from "express";
import { body, query } from "express-validator";
import { register, login, refresh, logout, verifyEmail, resendVerification } from "../controllers/authController";
import { AuthenticatedRequest, requireAuth, optionalAuth } from "../middleware/auth";
import { validateRequest } from "../middleware/validate";

const router = Router();

router.post(
  "/register",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Please enter your full name.")
      .isLength({ min: 2, max: 100 })
      .withMessage("Full name must be between 2 and 100 characters."),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Please enter your email address.")
      .isEmail()
      .withMessage("Please enter a valid email address (e.g. name@example.com).")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Please enter a password.")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long.")
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
      .notEmpty()
      .withMessage("Please enter your email address.")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail(),
    body("password")
      .notEmpty()
      .withMessage("Please enter your password.")
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
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
          ok: false,
          code: "REFRESH_TOKEN_REQUIRED",
          message: "Refresh token is required. Please sign in to refresh your session."
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

router.get(
  "/verify-email",
  [
    query("token")
      .trim()
      .notEmpty()
      .withMessage("Verification token is required. Please check your verification link.")
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await verifyEmail(req, res, next);
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  "/verify-email",
  [
    body("token")
      .trim()
      .notEmpty()
      .withMessage("Verification token is required. Please check your verification link.")
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await verifyEmail(req, res, next);
    } catch (err) {
      return next(err);
    }
  }
);

router.post(
  "/resend-verification",
  [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("Please enter your email address.")
      .isEmail()
      .withMessage("Please enter a valid email address.")
      .normalizeEmail()
  ],
  validateRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      return await resendVerification(req, res, next);
    } catch (err) {
      return next(err);
    }
  }
);

router.get("/me", requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.json({ ok: true, user: req.user });
});

export default router;
