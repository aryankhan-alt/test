import express from "express";
import puppeteer from "puppeteer";

const app = express();
const port = process.env.PORT || 3000;

app.get("/fetch-video", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).json({ error: "Missing ?url=" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(targetUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    const videoUrl = await page.evaluate(() => {
      const videoExtensions = [".m3u8", ".mp4", ".webm", ".ts", ".mpd", ".mkv"];
      let found = "";

      document.querySelectorAll("iframe, source, video, script, a").forEach((el) => {
        const src = el.src || el.href || "";
        if (src && videoExtensions.some((ext) => src.includes(ext))) {
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
    console.error(err);
    res.status(500).json({ success: false, error: err.toString() });
  }
});

app.get("/", (req, res) => {
  res.send("👋 Puppeteer API is running. Use /fetch-video?url=...");
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
