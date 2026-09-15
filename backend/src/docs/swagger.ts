import { Express, Request, Response, Router } from "express";
import swaggerUi from "swagger-ui-express";

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Event Planning API",
    version: "1.0.0",
    description: `
**Event Planning Platform REST API**

This API provides comprehensive backend endpoints for managing events, user authentication, email verification, RSVP tracking, and real-time event status calculations.

### Features:
* **Authentication**: JWT-based auth with access and refresh tokens, httpOnly cookies, and email verification.
* **Events**: Full CRUD operations, dynamic real-time statuses (*Upcoming*, *Ongoing*, *Past*), Levenshtein fuzzy search, tag filtering, pagination, and sorting.
* **RSVP & Attendance**: Mark presence (*yes*, *no*, *maybe*), retrieve attendee details, and calculate real-time RSVP statistics.
* **Security**: Bearer token authentication in \`Authorization\` header or \`accessToken\` cookie.
    `,
    contact: {
      name: "API Support",
      email: "support@eventplanning.local"
    }
  },
  servers: [
    {
      url: "http://localhost:4000",
      description: "Local Development Server"
    },
    {
      url: "/",
      description: "Current Host / Base URL"
    }
  ],
  tags: [
    {
      name: "Health",
      description: "Health checks and root connectivity"
    },
    {
      name: "Auth",
      description: "User registration, authentication, email verification, and session management"
    },
    {
      name: "Events",
      description: "Event creation, listing, retrieval, update, and deletion"
    },
    {
      name: "RSVP & Attendance",
      description: "Event attendance registration and attendee list retrieval"
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT Bearer token. Example: Bearer eyJhbGciOi..."
      },
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
        description: "Access token provided via httpOnly cookie"
      }
    },
    schemas: {
      StandardResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          message: { type: "string", example: "Operation completed successfully" }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: false },
          message: { type: "string", example: "An error occurred" },
          code: { type: "string", example: "ERROR_CODE" }
        }
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: false },
          code: { type: "string", example: "VALIDATION_ERROR" },
          message: { type: "string", example: "Please enter a valid email address." },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "email" },
                message: { type: "string", example: "Please enter a valid email address." },
                msg: { type: "string", example: "Please enter a valid email address." },
                value: { type: "string", example: "invalid_input" },
                location: { type: "string", example: "body" }
              }
            }
          },
          fields: {
            type: "object",
            additionalProperties: { type: "string" },
            example: {
              email: "Please enter a valid email address.",
              password: "Password must be at least 6 characters long."
            }
          }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", format: "email", example: "jane.doe@example.com" },
          is_verified: { type: "integer", example: 1, description: "1 if verified, 0 if pending" }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Jane Doe", description: "User's full name" },
          email: { type: "string", format: "email", example: "jane.doe@example.com" },
          password: { type: "string", minLength: 6, example: "Password123!", description: "Minimum 6 characters" }
        }
      },
      RegisterResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          message: { type: "string", example: "Registration successful! Please check your email to verify your account." },
          email: { type: "string", example: "jane.doe@example.com" },
          requiresVerification: { type: "boolean", example: true },
          user: { $ref: "#/components/schemas/User" }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "jane.doe@example.com" },
          password: { type: "string", example: "Password123!" }
        }
      },
      LoginResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          message: { type: "string", example: "Login successful" },
          accessToken: { type: "string", example: "eyJhbGciOi..." },
          refreshToken: { type: "string", example: "eyJhbGciOi..." },
          token: { type: "string", example: "eyJhbGciOi...", description: "Backward compatible alias for accessToken" },
          user: { $ref: "#/components/schemas/User" }
        }
      },
      RefreshTokenRequest: {
        type: "object",
        properties: {
          refreshToken: {
            type: "string",
            example: "eyJhbGciOi...",
            description: "Optional if supplied via httpOnly cookie 'refreshToken' or 'x-refresh-token' header"
          }
        }
      },
      VerifyEmailBody: {
        type: "object",
        required: ["token"],
        properties: {
          token: { type: "string", example: "4a8c9b2f1e5d3c7a..." }
        }
      },
      ResendVerificationRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "jane.doe@example.com" }
        }
      },
      RsvpSummary: {
        type: "object",
        properties: {
          yes: { type: "integer", example: 12 },
          maybe: { type: "integer", example: 4 },
          no: { type: "integer", example: 2 }
        }
      },
      Attendee: {
        type: "object",
        properties: {
          id: { type: "integer", example: 2 },
          name: { type: "string", example: "Alex Smith" },
          email: { type: "string", format: "email", example: "alex@example.com" },
          updatedAt: { type: "string", format: "date-time", example: "2026-09-15T08:30:00.000Z" }
        }
      },
      EventCreator: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Jane Doe" },
          email: { type: "string", example: "jane.doe@example.com" }
        }
      },
      Event: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          title: { type: "string", example: "Annual Tech Conference 2026" },
          description: { type: "string", example: "A premier tech gathering exploring state-of-the-art AI and cloud computing." },
          date: { type: "string", format: "date", example: "2026-10-25" },
          time: { type: "string", example: "09:00" },
          location: { type: "string", example: "Grand Auditorium, Convention Center" },
          imageUrl: { type: "string", nullable: true, example: "https://images.unsplash.com/photo-1540575467063-178a50c2df87" },
          tags: {
            type: "array",
            items: { type: "string" },
            example: ["Tech", "Networking", "AI"]
          },
          status: {
            type: "string",
            enum: ["Upcoming", "Ongoing", "Past"],
            example: "Upcoming",
            description: "Computed in real-time based on date and time"
          },
          createdBy: { type: "integer", example: 1 },
          creator: { $ref: "#/components/schemas/EventCreator" },
          isCreator: { type: "boolean", example: true },
          rsvpSummary: { $ref: "#/components/schemas/RsvpSummary" },
          userPresence: {
            type: "string",
            nullable: true,
            enum: ["yes", "no", "maybe", null],
            example: "yes"
          },
          attendees: {
            type: "object",
            properties: {
              yes: { type: "array", items: { $ref: "#/components/schemas/Attendee" } },
              maybe: { type: "array", items: { $ref: "#/components/schemas/Attendee" } },
              no: { type: "array", items: { $ref: "#/components/schemas/Attendee" } }
            }
          },
          createdAt: { type: "string", format: "date-time", example: "2026-09-10T14:30:00.000Z" },
          updatedAt: { type: "string", format: "date-time", example: "2026-09-12T16:45:00.000Z" }
        }
      },
      CreateEventRequest: {
        type: "object",
        required: ["title", "date", "time"],
        properties: {
          title: { type: "string", maxLength: 255, example: "Web Development Workshop" },
          description: { type: "string", example: "Hands-on TypeScript and modern web architectures." },
          date: { type: "string", example: "2026-11-15", description: "Event date (YYYY-MM-DD)" },
          time: { type: "string", example: "14:00", description: "Event time (HH:mm)" },
          location: { type: "string", example: "Room 402, Science Hall" },
          imageUrl: { type: "string", example: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4" },
          image_url: { type: "string", description: "Alternative key for imageUrl" },
          tags: {
            type: "array",
            items: { type: "string" },
            example: ["Workshop", "TypeScript", "Code"]
          },
          status: { type: "string", example: "Upcoming" }
        }
      },
      UpdateEventRequest: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 255, example: "Advanced Web Development Workshop" },
          description: { type: "string", example: "Updated description for hands-on workshop." },
          date: { type: "string", example: "2026-11-16" },
          time: { type: "string", example: "15:00" },
          location: { type: "string", example: "Room 501, Main Building" },
          imageUrl: { type: "string", example: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4" },
          tags: {
            type: "array",
            items: { type: "string" },
            example: ["Workshop", "Architecture"]
          },
          status: { type: "string", example: "Upcoming" }
        }
      },
      MarkPresenceRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: {
            type: "string",
            enum: ["yes", "no", "maybe"],
            example: "yes",
            description: "Can also be passed as 'presence'"
          }
        }
      },
      MarkPresenceResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          message: { type: "string", example: "Presence marked as 'yes' successfully" },
          eventId: { type: "integer", example: 1 },
          presence: { type: "string", example: "yes" },
          rsvpSummary: { $ref: "#/components/schemas/RsvpSummary" }
        }
      },
      GetPresenceResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          eventId: { type: "integer", example: 1 },
          eventTitle: { type: "string", example: "Annual Tech Conference 2026" },
          rsvpSummary: { $ref: "#/components/schemas/RsvpSummary" },
          attendees: {
            type: "object",
            properties: {
              yes: { type: "array", items: { $ref: "#/components/schemas/Attendee" } },
              maybe: { type: "array", items: { $ref: "#/components/schemas/Attendee" } },
              no: { type: "array", items: { $ref: "#/components/schemas/Attendee" } }
            }
          }
        }
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 4 },
          totalItems: { type: "integer", example: 18 },
          totalPages: { type: "integer", example: 5 },
          hasNextPage: { type: "boolean", example: true },
          hasPrevPage: { type: "boolean", example: false }
        }
      },
      StatusCounts: {
        type: "object",
        properties: {
          all: { type: "integer", example: 18 },
          upcoming: { type: "integer", example: 12 },
          ongoing: { type: "integer", example: 2 },
          past: { type: "integer", example: 4 }
        }
      },
      EventListResponse: {
        type: "object",
        properties: {
          ok: { type: "boolean", example: true },
          events: {
            type: "array",
            items: { $ref: "#/components/schemas/Event" }
          },
          count: { type: "integer", example: 4 },
          total: { type: "integer", example: 18 },
          pagination: { $ref: "#/components/schemas/PaginationMeta" },
          counts: { $ref: "#/components/schemas/StatusCounts" },
          tags: {
            type: "array",
            items: { type: "string" },
            example: ["Tech", "Design", "Music", "Workshop"]
          }
        }
      }
    }
  },
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Root Health Status",
        description: "Returns an acknowledgment indicating the server is alive and responding.",
        responses: {
          "200": {
            description: "Server is online",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } }
                }
              }
            }
          }
        }
      }
    },
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "API Health Check",
        description: "Endpoint to verify the operational state of the API.",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } }
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        description: "Creates a new user account with hashed password and dispatches an activation/verification link via email.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "User registered successfully; verification email sent.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterResponse" }
              }
            }
          },
          "400": {
            description: "Validation error (e.g. invalid email, short password)",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" }
              }
            }
          },
          "409": {
            description: "Conflict: email already registered",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Authenticate user and receive tokens",
        description: "Validates user credentials, checks if the email is verified, stores refresh token in database, and issues both access and refresh tokens (including httpOnly cookies).",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful; returns tokens and sets cookies.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          "400": {
            description: "Missing or invalid form fields",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" }
              }
            }
          },
          "401": {
            description: "Invalid email or password",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "403": {
            description: "Email not yet verified",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: false },
                    code: { type: "string", example: "EMAIL_NOT_VERIFIED" },
                    message: { type: "string", example: "Please verify your email address before logging in." },
                    email: { type: "string", example: "jane.doe@example.com" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Rotate refresh token and get new access token",
        description: "Validates existing refresh token from cookie, request body, or header, revokes the old one, and generates a fresh token pair.",
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RefreshTokenRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Tokens successfully rotated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" }
              }
            }
          },
          "400": {
            description: "Refresh token is missing",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "401": {
            description: "Refresh token expired, invalid, or reuse detected",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out user",
        description: "Revokes the active refresh token and clears access & refresh cookies.",
        responses: {
          "200": {
            description: "Successfully logged out",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StandardResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/verify-email": {
      get: {
        tags: ["Auth"],
        summary: "Verify user email via URL query token",
        description: "Confirms user registration using the verification token passed as a query parameter.",
        parameters: [
          {
            name: "token",
            in: "query",
            required: true,
            description: "Verification token sent to the user's email",
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: "Email verified successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    message: { type: "string", example: "Email verified successfully! You can now log in." },
                    email: { type: "string", example: "jane.doe@example.com" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid or expired token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Auth"],
        summary: "Verify user email via JSON request body",
        description: "Confirms user registration using the verification token sent in JSON payload.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyEmailBody" }
            }
          }
        },
        responses: {
          "200": {
            description: "Email verified successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    message: { type: "string", example: "Email verified successfully! You can now log in." },
                    email: { type: "string", example: "jane.doe@example.com" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid or expired token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/resend-verification": {
      post: {
        tags: ["Auth"],
        summary: "Resend email verification link",
        description: "Generates a new verification token and resends the activation email if the account exists and is unverified.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ResendVerificationRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Verification email sent (or obscured if email does not exist)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    message: { type: "string", example: "A new verification email has been sent. Please check your inbox." },
                    email: { type: "string", example: "jane.doe@example.com" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Already verified or invalid email",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current authenticated user profile",
        description: "Returns the profile of the currently logged-in user from the decoded JWT token.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          "200": {
            description: "User profile returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Unauthorized: Missing or invalid token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/events": {
      get: {
        tags: ["Events"],
        summary: "List all events with filtering, fuzzy search, and pagination",
        description: `
Retrieves a paginated list of events. Computes real-time dynamic status (*Upcoming*, *Ongoing*, *Past*) for each event.
Supports optional authentication to populate the caller's personal RSVP presence and creator permissions.
        `,
        security: [{ bearerAuth: [] }, { cookieAuth: [] }, {}],
        parameters: [
          {
            name: "tag",
            in: "query",
            required: false,
            description: "Filter events by specific tag (case-insensitive, e.g. 'Tech', 'Music')",
            schema: { type: "string" }
          },
          {
            name: "status",
            in: "query",
            required: false,
            description: "Filter events by dynamic status ('Upcoming', 'Ongoing', 'Past', 'All')",
            schema: { type: "string", enum: ["Upcoming", "Ongoing", "Past", "All"] }
          },
          {
            name: "search",
            in: "query",
            required: false,
            description: "Fuzzy search keyword matched against event title, description, location, and tags using Levenshtein distance",
            schema: { type: "string" }
          },
          {
            name: "creator",
            in: "query",
            required: false,
            description: "Filter by creator user ID or 'me' (when authenticated)",
            schema: { type: "string" }
          },
          {
            name: "sort",
            in: "query",
            required: false,
            description: "Sort mode: 'popularity' (by 'yes' RSVPs), 'creation_time', 'event_time_asc', 'event_time_desc'",
            schema: { type: "string", enum: ["popularity", "creation_time", "event_time_asc", "event_time_desc"] }
          },
          {
            name: "order",
            in: "query",
            required: false,
            description: "Sort direction: 'asc' or 'desc'",
            schema: { type: "string", enum: ["asc", "desc"], default: "asc" }
          },
          {
            name: "page",
            in: "query",
            required: false,
            description: "Page number (defaults to 1)",
            schema: { type: "integer", minimum: 1, default: 1 }
          },
          {
            name: "limit",
            in: "query",
            required: false,
            description: "Items per page (default 4, max 100, or 'all')",
            schema: { type: "string", default: "4" }
          }
        ],
        responses: {
          "200": {
            description: "Filtered and paginated events list",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/EventListResponse" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      post: {
        tags: ["Events"],
        summary: "Create a new event",
        description: "Creates a new event entity belonging to the authenticated user.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateEventRequest" }
            }
          }
        },
        responses: {
          "201": {
            description: "Event created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    message: { type: "string", example: "Event created successfully" },
                    event: { $ref: "#/components/schemas/Event" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Validation failure",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationErrorResponse" }
              }
            }
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/events/{id}": {
      get: {
        tags: ["Events"],
        summary: "Get single event details by ID",
        description: "Returns the full event object, including RSVP summary, attendee lists categorized by response, and current user presence.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }, {}],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique event ID",
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": {
            description: "Event found and returned",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    event: { $ref: "#/components/schemas/Event" }
                  }
                }
              }
            }
          },
          "400": {
            description: "Invalid event ID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "404": {
            description: "Event not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      put: {
        tags: ["Events"],
        summary: "Update event (Creator only)",
        description: "Updates an existing event. Only the user who created the event is authorized to update it.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique event ID",
            schema: { type: "integer" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateEventRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Event updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    message: { type: "string", example: "Event updated successfully" },
                    event: { $ref: "#/components/schemas/Event" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "403": {
            description: "Forbidden: Not the event creator",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "404": {
            description: "Event not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      patch: {
        tags: ["Events"],
        summary: "Partially update event (Creator only)",
        description: "Partially modifies properties of an existing event.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique event ID",
            schema: { type: "integer" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateEventRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Event updated successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    message: { type: "string", example: "Event updated successfully" },
                    event: { $ref: "#/components/schemas/Event" }
                  }
                }
              }
            }
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "403": {
            description: "Forbidden: Not the event creator",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "404": {
            description: "Event not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      delete: {
        tags: ["Events"],
        summary: "Delete event (Creator only)",
        description: "Deletes an event and cascades the removal of associated attendee presence records.",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique event ID",
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": {
            description: "Event deleted successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    ok: { type: "boolean", example: true },
                    message: { type: "string", example: 'Event "Tech Summit" deleted successfully' },
                    deletedEventId: { type: "integer", example: 1 }
                  }
                }
              }
            }
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "403": {
            description: "Forbidden: Not the event creator",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "404": {
            description: "Event not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/events/{id}/presence": {
      post: {
        tags: ["RSVP & Attendance"],
        summary: "Mark user presence (RSVP)",
        description: "Records or updates the authenticated user's presence for the specified event ('yes', 'no', or 'maybe').",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique event ID",
            schema: { type: "integer" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MarkPresenceRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "Presence recorded successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MarkPresenceResponse" }
              }
            }
          },
          "400": {
            description: "Invalid status value (must be 'yes', 'no', or 'maybe')",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "404": {
            description: "Event not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      get: {
        tags: ["RSVP & Attendance"],
        summary: "Get presence summary and attendee list",
        description: "Retrieves the counts and user lists of attendees grouped by 'yes', 'maybe', and 'no'.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique event ID",
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": {
            description: "Presence details and attendee lists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GetPresenceResponse" }
              }
            }
          },
          "400": {
            description: "Invalid event ID",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "404": {
            description: "Event not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    },
    "/api/events/{id}/rsvp": {
      post: {
        tags: ["RSVP & Attendance"],
        summary: "Mark RSVP (Alias for /presence)",
        description: "Alias endpoint to register event attendance ('yes', 'no', or 'maybe').",
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique event ID",
            schema: { type: "integer" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/MarkPresenceRequest" }
            }
          }
        },
        responses: {
          "200": {
            description: "RSVP recorded successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/MarkPresenceResponse" }
              }
            }
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          },
          "404": {
            description: "Event not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      },
      get: {
        tags: ["RSVP & Attendance"],
        summary: "Get RSVP attendee breakdown (Alias for /presence)",
        description: "Alias endpoint to retrieve attendee lists and response counts.",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Unique event ID",
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": {
            description: "RSVP attendee details",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GetPresenceResponse" }
              }
            }
          },
          "404": {
            description: "Event not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" }
              }
            }
          }
        }
      }
    }
  }
};

const swaggerUiOptions: swaggerUi.SwaggerOptions = {
  customSiteTitle: "Event Planning API Docs",
  customCss: `
    .swagger-ui .topbar { background-color: #1e293b; }
    .swagger-ui .topbar-wrapper img { content: url('https://img.icons8.com/color/48/000000/event-accepted.png'); }
    .swagger-ui .info .title { color: #0f172a; }
  `,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    docExpansion: "list"
  }
};

/**
 * Configure and register Swagger documentation routes on the Express application
 */
export function setupSwagger(app: Express) {
  const router = Router();

  // Serve raw OpenAPI JSON spec
  router.get("/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.json(swaggerSpec);
  });

  // Serve interactive Swagger UI at /api/docs
  router.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
  );

  // Mount router under /api
  app.use("/api", router);

  // Provide convenient aliases at root level
  app.get("/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.json(swaggerSpec);
  });

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, swaggerUiOptions)
  );
}

