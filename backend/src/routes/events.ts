import { NextFunction, Request, Response, Router } from "express";
import { body, validationResult } from "express-validator";
import { requireAuth, optionalAuth, AuthenticatedRequest } from "../middleware/auth";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  markPresence,
  getPresence
} from "../controllers/eventController";

const router = Router();

// Validation helper middleware
function validateRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: errors.array()[0].msg,
      errors: errors.array()
    });
  }
  return next();
}

/**
 * @route   POST /api/events
 * @desc    Create a new event
 * @access  Private (Authenticated users only)
 */
router.post(
  "/",
  requireAuth,
  [
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Event title is required.")
      .isLength({ max: 255 })
      .withMessage("Title cannot exceed 255 characters."),
    body("date")
      .trim()
      .notEmpty()
      .withMessage("Event date is required."),
    body("time")
      .trim()
      .notEmpty()
      .withMessage("Event time is required."),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be a string."),
    body("tags")
      .optional(),
    body("location")
      .optional()
      .isString()
      .withMessage("Location must be a string."),
    body("status")
      .optional()
      .isString()
      .withMessage("Status must be a string."),
    body("imageUrl")
      .optional()
      .isString()
      .withMessage("Image URL must be a string."),
    body("image_url")
      .optional()
      .isString()
      .withMessage("Image URL must be a string.")
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await createEvent(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /api/events
 * @desc    Fetch all events (supports tag, search, status filters)
 * @access  Public / Optional Auth (identifies user presence & ownership)
 */
router.get("/", optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await getEvents(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/events/:id
 * @desc    Fetch single event details with attendee presence
 * @access  Public / Optional Auth
 */
router.get("/:id", optionalAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await getEventById(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   PUT /api/events/:id
 * @desc    Modify event (Creator only)
 * @access  Private (Creator only)
 */
router.put(
  "/:id",
  requireAuth,
  [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Event title cannot be empty.")
      .isLength({ max: 255 })
      .withMessage("Title cannot exceed 255 characters."),
    body("date")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Event date cannot be empty."),
    body("time")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Event time cannot be empty.")
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await updateEvent(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   PATCH /api/events/:id
 * @desc    Partial modify event (Creator only)
 * @access  Private (Creator only)
 */
router.patch(
  "/:id",
  requireAuth,
  [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Event title cannot be empty.")
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await updateEvent(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   DELETE /api/events/:id
 * @desc    Delete event (Creator only)
 * @access  Private (Creator only)
 */
router.delete("/:id", requireAuth, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    await deleteEvent(req, res, next);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/events/:id/presence (or /api/events/:id/rsvp)
 * @desc    Mark user presence: 'yes' or 'no'
 * @access  Private (Authenticated users)
 */
const presenceValidation = [
  body().custom((value, { req }) => {
    const status = (req.body.status || req.body.presence || "").toString().toLowerCase().trim();
    if (status !== "yes" && status !== "no" && status !== "maybe") {
      throw new Error("Presence status must be either 'yes', 'no', or 'maybe'.");
    }
    return true;
  })
];

router.post(
  "/:id/presence",
  requireAuth,
  presenceValidation,
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await markPresence(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/:id/rsvp",
  requireAuth,
  presenceValidation,
  validateRequest,
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      await markPresence(req, res, next);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @route   GET /api/events/:id/presence (or /api/events/:id/rsvp)
 * @desc    Get presence and attendee list
 * @access  Public / Optional Auth
 */
router.get("/:id/presence", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getPresence(req, res, next);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/rsvp", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getPresence(req, res, next);
  } catch (err) {
    next(err);
  }
});

export default router;
