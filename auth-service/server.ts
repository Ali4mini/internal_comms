import express from "express";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "my_super_secret_key_123";

// Define what goes into our Token
interface UserPayload {
  username: string;
  role: string;
}

app.post("/login", (req: Request, res: Response): any => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username required" });
  }

  const payload: UserPayload = {
    username: username as string,
    role: "employee",
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

  return res.json({ token, username });
});

app.listen(3000, () => {
  console.log("🔐 Auth Service (TS) running on port 3000");
});
