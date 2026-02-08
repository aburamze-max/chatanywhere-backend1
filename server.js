import express from "express";
import cors from "cors";

const app = express();

// ===== CORS =====
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json({ limit: "2mb" }));

// ===== Health Check =====
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Render backend proxy is running",
    upstream: "https://api.chatanywhere.tech"
  });
});

// ===== Proxy Endpoint =====
app.post("/v1/chat/completions", async (req, res) => {
  try {
    const apiKey = (process.env.OPENAI_API_KEY || "").trim();

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is missing in Render Environment Variables"
      });
    }

    const upstreamResp = await fetch(
      "https://api.chatanywhere.tech/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(req.body)
      }
    );

    const text = await upstreamResp.text();

    res.status(upstreamResp.status);
    try {
      res.json(JSON.parse(text));
    } catch {
      res.send(text);
    }
  } catch (err) {
    res.status(500).json({
      error: String(err?.message || err)
    });
  }
});

// ===== Start Server =====
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server running on port", port);
});
