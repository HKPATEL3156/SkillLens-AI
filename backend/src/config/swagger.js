const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SkillLensAI API Documentation",
      version: "2.0.0",
      description: "Complete REST API specifications for the SkillLensAI student career development, AI tutor, assessments, and recruiter platform.",
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter JWT access token. Example: Bearer <JWT-token>",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/config/swaggerDocs.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
