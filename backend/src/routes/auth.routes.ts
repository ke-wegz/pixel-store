import { Router, type Request, type Response } from "express";

export const authRouter = Router();

authRouter.post("/login", (req: Request, res: Response) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || "pixeladmin2026";

  if (!password) {
    return res.status(400).json({ success: false, message: "Password is required." });
  }

  if (password === adminPassword) {
    // Generate a simple session token
    const token = Buffer.from(`admin:${Date.now()}`).toString("base64");
    return res.json({
      success: true,
      message: "Admin authentication successful",
      token,
      user: { role: "admin", username: "admin" },
    });
  }

  return res.status(401).json({ success: false, message: "Invalid admin password." });
});
