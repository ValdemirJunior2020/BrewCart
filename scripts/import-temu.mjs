import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2).filter(Boolean);

if (!args.length) {
  console.error("Usage: npm run import:temu -- <temu-product-url> [more urls...]");
  process.exit(1);
}

function isTemuUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "temu.com" || url.hostname.endsWith(".temu.com"));
  } catch {
    return false;
  }
}

function productIdFromUrl(value) {
  const match = value.match(/-g-(\d+)\.html/i);
  return match?.[1] || ("temu-" + Date.now());
}

function normalizeUrl(value, baseUrl) {
  if (!value || typeof value !== "string") return null;

  let raw = value
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

function canonicalMediaKey(value) {
  try {
    const url = new URL(value);
    return url.origin + url.pathname;
  } catch {
    return value;
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
    return /\.(mp4|webm|m3u8)$/.test(pathname) ||
      pathname.includes("/video/") ||
      pathname.includes("video");
  } catch {
    return false;
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

async function collectDomMedia(page) {
  return await page.evaluate(() => {
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
      performanceEntries: performance
        .getEntriesByType("resource")
        .map((entry) => entry.name)
    };
  });
}

async function downloadMedia(request, mediaUrl, folder, index, referer, wantedType) {
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

    const isImage = contentType.startsWith("image/");
    const isVideo =
      contentType.startsWith("video/") ||
      ext === ".m3u8" ||
      contentType.includes("mpegurl");

    if (wantedType === "image" && !isImage) return null;
    if (wantedType === "video" && !isVideo) return null;

    const filename =
      String(index).padStart(3, "0") +
      (ext || (wantedType === "image" ? ".jpg" : ".mp4"));

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

async function importProduct(browser, productUrl) {
  if (!isTemuUrl(productUrl)) {
    console.warn("Skipping non-Temu URL:", productUrl);
    return;
  }

  const productId = productIdFromUrl(productUrl);
  const root = path.join(process.cwd(), "data", "imports", productId);
  const imageDir = path.join(root, "images");
  const videoDir = path.join(root, "videos");

  // Remove the previous bad import so old logos/payment icons are not left behind.
  await fs.rm(root, { recursive: true, force: true });
  await fs.mkdir(imageDir, { recursive: true });
  await fs.mkdir(videoDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    locale: "en-US"
  });

  const page = await context.newPage();

  const responseProductImages = new Set();
  const responseVideos = new Set();

  page.on("response", async (response) => {
    const mediaUrl = response.url();
    const contentType = (await response.headerValue("content-type")) || "";

    if (
      contentType.startsWith("image/") &&
      isProductImageUrl(mediaUrl)
    ) {
      responseProductImages.add(mediaUrl);
    }

    if (
      contentType.startsWith("video/") ||
      contentType.includes("mpegurl")
    ) {
      responseVideos.add(mediaUrl);
    }
  });

  console.log("\nLoading product " + productId + "...");

  await page.goto(productUrl, {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  await page.waitForTimeout(7000);

  // Scroll only to trigger lazy-loaded product media.
  for (let i = 0; i < 10; i += 1) {
    await page.mouse.wheel(0, 650);
    await page.waitForTimeout(450);
  }

  await page.mouse.wheel(0, -10000);
  await page.waitForTimeout(1200);

  const dom = await collectDomMedia(page);
  const html = await page.content();

  const allRawCandidates = [
    ...dom.images,
    ...dom.performanceEntries,
    ...extractUrlsFromHtml(html),
    ...responseProductImages
  ];

  const normalizedImageCandidates = allRawCandidates
    .map((url) => normalizeUrl(url, page.url()))
    .filter(Boolean)
    .filter(isProductImageUrl);

  // Dedupe resized copies of the same Temu product image by ignoring query strings.
  const productImageMap = new Map();
  for (const mediaUrl of normalizedImageCandidates) {
    const key = canonicalMediaKey(mediaUrl);
    if (!productImageMap.has(key)) productImageMap.set(key, mediaUrl);
  }

  const productImageUrls = [...productImageMap.values()];

  const normalizedVideoCandidates = [
    ...dom.videos,
    ...dom.performanceEntries,
    ...responseVideos,
    ...extractUrlsFromHtml(html)
  ]
    .map((url) => normalizeUrl(url, page.url()))
    .filter(Boolean)
    .filter(isLikelyVideoUrl);

  const videoMap = new Map();
  for (const mediaUrl of normalizedVideoCandidates) {
    const key = canonicalMediaKey(mediaUrl);
    if (!videoMap.has(key)) videoMap.set(key, mediaUrl);
  }

  const videoUrls = [...videoMap.values()];

  const downloadedImages = [];
  let imageIndex = 1;

  for (const mediaUrl of productImageUrls) {
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

  for (const mediaUrl of videoUrls) {
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
    pageTitle: dom.title,
    imageFilter:
      "Only kwcdn product assets (/product/) are retained. Logos, payment icons, QR codes and general site graphics are excluded.",
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
      " PRODUCT images and " +
      downloadedVideos.length +
      " videos."
  );
  console.log("Folder: " + root);

  await context.close();
}

let browser;

try {
  browser = await chromium.launch({
    channel: "chrome",
    headless: true
  });

  for (const productUrl of args) {
    await importProduct(browser, productUrl);
  }
} catch (error) {
  console.error("\nTemu import failed.");
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
