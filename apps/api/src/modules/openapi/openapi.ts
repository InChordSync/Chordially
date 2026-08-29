export const CreatorResponseSchema = {
  type: "object",
  required: [
    "id",
    "userId",
    "displayName",
    "slug",
    "bio",
    "avatarUrl",
    "genre",
    "location",
    "isVerified",
    "createdAt",
    "updatedAt",
  ],
  properties: {
    id: { type: "string" },
    userId: { type: "string" },
    displayName: { type: "string" },
    slug: { type: "string" },
    bio: { type: "string", nullable: true },
    avatarUrl: { type: "string", nullable: true },
    genre: { type: "string", nullable: true },
    location: { type: "string", nullable: true },
    isVerified: { type: "boolean" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
} as const

export const openapiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Chordially API",
    version: "0.1.0",
    description: "REST API for the Chordially live-creator tipping platform.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/health": {
      get: {
        tags: ["health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Service is healthy",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Register a new user (custodial wallet)",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Registered" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/api/auth/register-linked": {
      post: {
        tags: ["auth"],
        summary: "Register a new user with a linked wallet",
        security: [],
        responses: {
          "201": { description: "Registered" },
          "400": { description: "Invalid wallet proof" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Log in",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Logged in, returns JWT token" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/creators/{slug}": {
      get: {
        tags: ["creators"],
        summary: "Get a creator profile by slug",
        security: [],
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "Creator profile",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreatorResponse" },
              },
            },
          },
          "404": {
            description: "Creator not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/api/creators/trending": {
      get: {
        tags: ["creators"],
        summary: "List trending creators ranked by recent activity",
        security: [],
        parameters: [
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "Ranked list of trending creators",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["items"],
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CreatorResponse" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/creators/{slug}/media-order": {
      patch: {
        tags: ["creators"],
        summary: "Reorder a creator's media gallery and optionally set the cover",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "slug",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["items", "orderedIds"],
                properties: {
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["id", "isCover"],
                      properties: {
                        id: { type: "string" },
                        isCover: { type: "boolean" },
                      },
                    },
                  },
                  orderedIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                  coverId: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Reordered media items",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          position: { type: "integer" },
                          isCover: { type: "boolean" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Invalid request body" },
          "401": { description: "Unauthorized" },
          "404": { description: "Creator not found" },
        },
      },
    },
    "/api/fans/me": {
      get: {
        tags: ["fans"],
        summary: "Get the authenticated fan's profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Fan profile" },
          "401": { description: "Unauthorized" },
          "404": { description: "Fan profile not found" },
        },
      },
      patch: {
        tags: ["fans"],
        summary: "Update the authenticated fan's profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Updated fan profile" },
          "401": { description: "Unauthorized" },
          "404": { description: "Fan profile not found" },
        },
      },
    },
    "/api/fans/me/bookmarks": {
      get: {
        tags: ["fans"],
        summary: "List the authenticated fan's bookmarked creators",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "List of bookmarks" },
          "401": { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["fans"],
        summary: "Bookmark a creator for the authenticated fan",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["creatorId"],
                properties: { creatorId: { type: "string" } },
              },
            },
          },
        },
        responses: {
          "201": { description: "Bookmark created" },
          "400": { description: "Invalid request body" },
          "401": { description: "Unauthorized" },
          "404": { description: "Creator not found" },
        },
      },
    },
    "/api/fans/me/bookmarks/{creatorId}": {
      delete: {
        tags: ["fans"],
        summary: "Remove a bookmark for the authenticated fan",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "creatorId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": { description: "Bookmark removed" },
          "401": { description: "Unauthorized" },
          "404": { description: "Bookmark not found" },
        },
      },
    },
    "/api/activity/stream": {
      get: {
        tags: ["activity"],
        summary: "List a creator/user's activity stream, paginated",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "creatorId",
            in: "query",
            required: false,
            schema: { type: "string" },
          },
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            required: false,
            schema: { type: "integer", minimum: 1, default: 20 },
          },
        ],
        responses: {
          "200": { description: "Paginated activity items" },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      CreatorResponse: CreatorResponseSchema,
      Error: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
  },
} as const
