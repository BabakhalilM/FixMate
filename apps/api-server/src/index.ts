// apps/api-server/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/auth.routes";
import connectDB from "./config/db";
import reviewrouter from "./routes/reviewRoutes";
import repairrouter from "./routes/repair.route";
import userRouter from "./routes/user.route";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 5000;

// app.use(cors({ origin: ['https://landing-website-orpin.vercel.app', "http://localhost:3000"]}));

// Define allowed origins
const allowedOrigins = [
  // Local development
  "http://localhost:8081", // Expo web dev server
  "http://localhost:19006", // Older Expo web dev port
  "http://localhost:3000", // Admin dashboard dev
  "http://localhost:5173", // Vite dev server (if used)
  "https://landing-website-orpin.vercel.app",

  // Expo web hosting (EAS Hosting)
  
  "https://technician-app.expo.app",
  "https://technician-app--preview.expo.app",

  // Your future custom domains
  "https://technician.fixmate.com",
  "https://admin.fixmate.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      // Allow listed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Optional: allow any *.expo.app subdomain
      if (/^https:\/\/[a-z0-9-]+\.expo\.app$/.test(origin)) {
        return callback(null, true);
      }

      // Reject everything else
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Handle preflight requests explicitly (Express 5+)
app.options("*", cors());

// app.use(express.json());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/auth", router);
app.use("/api/reviews", reviewrouter);
app.use("/api/repairs", repairrouter);
app.use("/api/users", userRouter);

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// THIS IS THE IMPORTANT LINE
app.use("/uploads", express.static(uploadDir));

// Simple route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.listen(port, "0.0.0.0", async () => {
  try {
    console.log("Connecting to the database...");
    await connectDB();
    console.log(`🚀 API Server running on http://localhost:${port}`);
  } catch (error) {
    console.error("Error starting the server:", error);
  }
});
