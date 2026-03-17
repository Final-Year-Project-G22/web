import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "src/openapi/openapi.json",
    output: {
      mode: "tags",
      target: "src/lib/api/services",
      schemas: "src/lib/api/types",
      client: "fetch",
      clean: true,
    },
  },
});
