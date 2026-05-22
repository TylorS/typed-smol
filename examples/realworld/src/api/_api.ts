import * as Route from "@typed/router";

export const name = "realworld";
export const prefix = Route.Parse("/api");

export const openapi = {
  annotations: {
    title: "RealWorld API",
    version: "0.0.0",
    description: "Local RealWorld/Conduit API implemented with typed-smol.",
  },
  generation: { additionalProperties: false as const },
  exposure: {
    jsonPath: "/api/docs/openapi.json" as const,
    swaggerPath: false,
    scalar: false,
  },
};
