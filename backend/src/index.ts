import Fastify from "fastify";
import cors from "@fastify/cors";

const fastify = Fastify();

// Register CORS
await fastify.register(cors, {
  origin: ["http://localhost:5173", "http://127.0.0.1:5173", "*"],

  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],

  // If you are using Cookies or Authorization headers, this MUST be true
  credentials: true,

  allowedHeaders: ["Content-Type", "Authorization"],
});

fastify.get("/", async () => {
  return { hello: "world" };
});

fastify.listen({ port: 3000, host: "0.0.0.0" });
