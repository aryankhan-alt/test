import express from "express";
import { launch } from "puppeteer-core";
import { computeSystemExecutablePath } from "@puppeteer/browsers";

const app = express();
const port = process.env.PORT || 3000;

app.get("/fetch-video", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing ?url" });

  try {
    const executablePath = computeSystemExecutablePath({
      browser: "chromium",
      buildId: "121.0.6167.140", // latest as of June 2025
    });

    const browser = await launch({
      headless: "new",
      executablePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const videoUrl = await page.evaluate(() => {
      const exts = [".m3u8", ".mp4", ".webm", ".ts"];
      let found = "";
      document.querySelectorAll("video, source, script, iframe, a").forEach((el) => {
        const src = el.src || el.href || "";
        if (src && exts.some((ext) => src.includes(ext))) {
          found = src;
        }
      });
      return found;
    });

    await browser.close();

    if (videoUrl) {
      res.json({ success: true, video: videoUrl });
    } else {
      res.json({ success: false, video: null });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.toString() });
  }
});

app.get("/", (req, res) => {
  res.send("👋 Puppeteer API is running. Use /fetch-video?url=...");
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
