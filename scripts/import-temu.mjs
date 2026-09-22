import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2).filter(Boolean);

if (!args.length) {
  console.error("Usage: npm run import:temu -- <temu-product-url> [more urls...]");
  process.exit(1);
}

function productIdFromUrl(value) {
  const match = value.match(/-g-(\d+)\.html/i);
  return match?.[1] || ("temu-" + Date.now());
}

function normalizeUrl(value, baseUrl) {
  if (!value || typeof value !== "string") return null;

  const raw = value
    .trim()
    .replaceAll("\\u002F", "/")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&");

  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return null;

  try {
    return new URL(raw, baseUrl).href;
  } catch {
    return null;
  }
}

function isProductImageUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    return (
      (host === "img.kwcdn.com" || host.endsWith(".kwcdn.com")) &&
      pathname.includes("/product/")
    );
  } catch {
    return false;
  }
}

function isLikelyVideoUrl(value) {
  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();

    return (
      /\.(mp4|webm|m3u8)$/.test(pathname) ||
      pathname.includes("/video/")
    );
  } catch {
    return false;
  }
}

function canonicalMediaKey(value) {
  try {
    const url = new URL(value);
    return url.origin + url.pathname;
  } catch {
    return value;
  }
}

function extensionFromType(type, mediaUrl) {
  const cleanType = (type || "").split(";")[0].trim().toLowerCase();

  const byType = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "application/vnd.apple.mpegurl": ".m3u8",
    "application/x-mpegurl": ".m3u8"
  };

  if (byType[cleanType]) return byType[cleanType];

  try {
    const ext = path.extname(new URL(mediaUrl).pathname).toLowerCase();
    if (ext && ext.length <= 6) return ext;
  } catch {}

  return "";
}

function extractUrlsFromHtml(html) {
  const normalized = html
    .replaceAll("\\u002F", "/")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&");

  return normalized.match(/https?:\/\/[^"'<>\s]+/g) || [];
}

async function waitForTemuLogin(page, productUrl) {
  if (!/temu\.com\/login\.html/i.test(page.url())) return;

  console.log("");
  console.log("Temu requires login.");
  console.log("A Chrome window is open.");
  console.log("Log into Temu ONCE in that window.");
  console.log("BrewCart will continue automatically after login.");
  console.log("");

  const deadline = Date.now() + 5 * 60 * 1000;

  while (Date.now() < deadline) {
    await page.waitForTimeout(1500);

    if (!/temu\.com\/login\.html/i.test(page.url())) {
      await page.goto(productUrl, {
        waitUntil: "domcontentloaded",
        timeout: 60000
      });
      return;
    }
  }

  throw new Error("Temu login was not completed within 5 minutes.");
}

async function collectMedia(page) {
  const dom = await page.evaluate(() => {
    const images = new Set();
    const videos = new Set();

    const add = (set, value) => {
      if (typeof value === "string" && value.trim()) set.add(value.trim());
    };

    for (const img of document.querySelectorAll("img")) {
      add(images, img.currentSrc);
      add(images, img.src);
      add(images, img.getAttribute("data-src"));
      add(images, img.getAttribute("data-original"));

      const srcset = img.getAttribute("srcset");
      if (srcset) {
        for (const entry of srcset.split(",")) {
          add(images, entry.trim().split(/\s+/)[0]);
        }
      }
    }

    for (const video of document.querySelectorAll("video")) {
      add(videos, video.currentSrc);
      add(videos, video.src);

      for (const source of video.querySelectorAll("source")) {
        add(videos, source.src);
      }
    }

    return {
      title: document.title,
      images: [...images],
      videos: [...videos],
      resources: performance.getEntriesByType("resource").map((entry) => entry.name)
    };
  });

  const html = await page.content();

  return {
    ...dom,
    htmlUrls: extractUrlsFromHtml(html)
  };
}

async function downloadMedia(request, mediaUrl, folder, index, referer, kind) {
  try {
    const response = await request.get(mediaUrl, {
      headers: {
        referer,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
      },
      timeout: 30000
    });

    if (!response.ok()) return null;

    const contentType = response.headers()["content-type"] || "";
    const ext = extensionFromType(contentType, mediaUrl);

    if (kind === "image" && !contentType.startsWith("image/")) return null;

    if (
      kind === "video" &&
      !contentType.startsWith("video/") &&
      !contentType.includes("mpegurl") &&
      ext !== ".m3u8"
    ) {
      return null;
    }

    const filename =
      String(index).padStart(3, "0") +
      (ext || (kind === "image" ? ".jpg" : ".mp4"));

    await fs.writeFile(path.join(folder, filename), await response.body());

    return {
      filename,
      sourceUrl: mediaUrl,
      contentType
    };
  } catch {
    return null;
  }
}

async function importProduct(context, productUrl) {
  const productId = productIdFromUrl(productUrl);

  const root = path.join(process.cwd(), "data", "imports", productId);
  const imageDir = path.join(root, "images");
  const videoDir = path.join(root, "videos");

  await fs.rm(root, { recursive: true, force: true });
  await fs.mkdir(imageDir, { recursive: true });
  await fs.mkdir(videoDir, { recursive: true });

  const page = await context.newPage();

  const networkImages = new Set();
  const networkVideos = new Set();

  page.on("response", async (response) => {
    const mediaUrl = response.url();
    const contentType = (await response.headerValue("content-type")) || "";

    if (contentType.startsWith("image/") && isProductImageUrl(mediaUrl)) {
      networkImages.add(mediaUrl);
    }

    if (
      contentType.startsWith("video/") ||
      contentType.includes("mpegurl")
    ) {
      networkVideos.add(mediaUrl);
    }
  });

  console.log("");
  console.log("Loading product " + productId + "...");

  await page.goto(productUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  await waitForTemuLogin(page, productUrl);

  await page.waitForTimeout(7000);

  for (let i = 0; i < 12; i += 1) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(400);
  }

  await page.mouse.wheel(0, -10000);
  await page.waitForTimeout(1200);

  if (/temu\.com\/login\.html/i.test(page.url())) {
    throw new Error("Temu redirected back to login. Login was not retained.");
  }

  const collected = await collectMedia(page);

  const imageCandidates = [
    ...collected.images,
    ...collected.resources,
    ...collected.htmlUrls,
    ...networkImages
  ]
    .map((url) => normalizeUrl(url, page.url()))
    .filter(Boolean)
    .filter(isProductImageUrl);

  const imageMap = new Map();

  for (const mediaUrl of imageCandidates) {
    const key = canonicalMediaKey(mediaUrl);
    if (!imageMap.has(key)) imageMap.set(key, mediaUrl);
  }

  const videoCandidates = [
    ...collected.videos,
    ...collected.resources,
    ...collected.htmlUrls,
    ...networkVideos
  ]
    .map((url) => normalizeUrl(url, page.url()))
    .filter(Boolean)
    .filter(isLikelyVideoUrl);

  const videoMap = new Map();

  for (const mediaUrl of videoCandidates) {
    const key = canonicalMediaKey(mediaUrl);
    if (!videoMap.has(key)) videoMap.set(key, mediaUrl);
  }

  const downloadedImages = [];
  let imageIndex = 1;

  for (const mediaUrl of imageMap.values()) {
    const saved = await downloadMedia(
      context.request,
      mediaUrl,
      imageDir,
      imageIndex,
      page.url(),
      "image"
    );

    if (saved) {
      downloadedImages.push(saved);
      imageIndex += 1;
    }
  }

  const downloadedVideos = [];
  let videoIndex = 1;

  for (const mediaUrl of videoMap.values()) {
    const saved = await downloadMedia(
      context.request,
      mediaUrl,
      videoDir,
      videoIndex,
      page.url(),
      "video"
    );

    if (saved) {
      downloadedVideos.push(saved);
      videoIndex += 1;
    }
  }

  const manifest = {
    importedAt: new Date().toISOString(),
    source: "Temu",
    supplierProductId: productId,
    supplierUrl: productUrl,
    finalPageUrl: page.url(),
    pageTitle: collected.title,
    imageCount: downloadedImages.length,
    videoCount: downloadedVideos.length,
    images: downloadedImages,
    videos: downloadedVideos
  };

  await fs.writeFile(
    path.join(root, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  console.log(
    "Saved " +
      downloadedImages.length +
      " product images and " +
      downloadedVideos.length +
      " videos."
  );

  console.log("Folder: " + root);

  await page.close();
}

const userDataDir = path.join(process.cwd(), ".temu-browser-profile");

let context;

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1365, height: 900 },
    locale: "en-US"
  });

  for (const productUrl of args) {
    await importProduct(context, productUrl);
  }
} catch (error) {
  console.error("");
  console.error("Temu import failed.");
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  if (context) await context.close();
}
