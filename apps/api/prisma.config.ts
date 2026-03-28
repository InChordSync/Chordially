import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  seed: "tsx prisma/seed.ts"
});
