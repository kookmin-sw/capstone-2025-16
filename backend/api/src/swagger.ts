import swaggerJSDoc from "swagger-jsdoc";

const specs = swaggerJSDoc({
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Cohort API",
      version: "1.0.0",
      description: "Cohort API",
    },
  },
  apis: ["./src/routes/*.ts", "./src/dtos/*.ts"],
  failOnErrors: true,
});

export default specs;
