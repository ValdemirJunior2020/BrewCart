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
    return url.protocol === "https:" && (url.hostname === "temu.com" || url.hostname.endsWith(".temu.com"));
  } catch {
    return false;
  }
}

function productIdFromUrl(value) {
  const match = value.match(/-g-(\d+)\.html/i);
  return match?.[1] || ("temu-" + Date.now());
}

function normalizeMediaUrl(value, baseUrl) {
  if (!value || typeof value !== "string") return null;
  let raw = value.trim();
  if (!raw || raw.startsWith("data:") || raw.startsWith("blob:")) return null;
  raw = raw
    .replaceAll("\\u002F", "/")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&");
  try {
    return new URL(raw, baseUrl).href;
  } catch {
    return null;
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
    "application/vnd.apple.mpegurl": ".m3u8"
  };
  if (byType[cleanType]) return byType[cleanType];
  try {
    const ext = path.extname(new URL(mediaUrl).pathname).toLowerCase();
    if (ext && ext.length <= 6) return ext;
  } catch {}
  return "";
}

function walkJson(value, found) {
  if (Array.isArray(value)) {
    for (const item of value) walkJson(item, found);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (
      typeof child === "string" &&
      ["image","images","contenturl","thumbnailurl","video","url","src","poster"].includes(key.toLowerCase())
    ) {
      found.push(child);
    }
    walkJson(child, found);
  }
}

function extractUrlsFromHtml(html) {
  const normalized = html.replaceAll("\\u002F", "/").replaceAll("\\/", "/").replaceAll("&amp;", "&");
  const matches = normalized.match(/https?:\/\/[^"'<>\s]+/g) || [];
  return matches.map((value) => value.replace(/[),\]}]+$/, ""));
}

async function collectMedia(page) {
  const dom = await page.evaluate(() => {
    const images = new Set();
    const videos = new Set();
    const posters = new Set();
    const jsonLdValues = [];
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
        for (const entry of srcset.split(",")) add(images, entry.trim().split(/\s+/)[0]);
      }
    }

    for (const video of document.querySelectorAll("video")) {
      add(videos, video.currentSrc);
      add(videos, video.src);
      add(posters, video.poster);
      for (const source of video.querySelectorAll("source")) add(videos, source.src);
    }

    for (const source of document.querySelectorAll("source")) {
      add(videos, source.getAttribute("src"));
      const srcset = source.getAttribute("srcset");
      if (srcset) {
        for (const entry of srcset.split(",")) add(images, entry.trim().split(/\s+/)[0]);
      }
    }

    for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        jsonLdValues.push(JSON.parse(script.textContent || ""));
      } catch {}
    }

    return {
      title: document.title,
      images: [...images],
      videos: [...videos],
      posters: [...posters],
      jsonLdValues,
      performanceEntries: performance.getEntriesByType("resource").map((entry) => entry.name)
    };
  });

  const html = await page.content();
  return { ...dom, htmlUrls: extractUrlsFromHtml(html) };
}

function likelyImage(url) {
  return /\.(?:jpe?g|png|webp|avif|gif)(?:\?|$)/i.test(url) || /img\.kwcdn\.com/i.test(url);
}

function likelyVideo(url) {
  return /\.(?:mp4|webm|m3u8)(?:\?|$)/i.test(url) || /video/i.test(url);
}

async function downloadMedia(request, mediaUrl, folder, index, referer) {
  try {
    const response = await request.get(mediaUrl, {
      headers: {
        referer,
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36"
      },
      timeout: 30000
    });

    if (!response.ok()) return null;

    const type = response.headers()["content-type"] || "";
    const ext = extensionFromType(type, mediaUrl);
    const isImage = type.startsWith("image/");
    const isVideo = type.startsWith("video/") || ext === ".m3u8";
    if (!isImage && !isVideo) return null;

    const filename = String(index).padStart(3, "0") + (ext || (isImage ? ".jpg" : ".mp4"));
    await fs.writeFile(path.join(folder, filename), await response.body());
    return { filename, sourceUrl: mediaUrl, contentType: type };
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
  await fs.mkdir(imageDir, { recursive: true });
  await fs.mkdir(videoDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    locale: "en-US"
  });
  const page = await context.newPage();

  console.log("\nLoading product " + productId);
  await page.goto(productUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(6000);

  for (let i = 0; i < 12; i += 1) {
    await page.mouse.wheel(0, 650);
    await page.waitForTimeout(400);
  }

  await page.mouse.wheel(0, -10000);
  await page.waitForTimeout(1200);

  const collected = await collectMedia(page);
  const jsonLdUrls = [];
  for (const value of collected.jsonLdValues) walkJson(value, jsonLdUrls);

  const allCandidates = [
    ...collected.images,
    ...collected.videos,
    ...collected.posters,
    ...collected.performanceEntries,
    ...collected.htmlUrls,
    ...jsonLdUrls
  ]
    .map((url) => normalizeMediaUrl(url, page.url()))
    .filter(Boolean);

  const uniqueCandidates = [...new Set(allCandidates)];
  const imageUrls = uniqueCandidates.filter(likelyImage);
  const videoUrls = uniqueCandidates.filter(likelyVideo);

  const downloadedImages = [];
  let imageIndex = 1;
  for (const mediaUrl of imageUrls) {
    const saved = await downloadMedia(context.request, mediaUrl, imageDir, imageIndex, page.url());
    if (saved) {
      downloadedImages.push(saved);
      imageIndex += 1;
    }
  }

  const downloadedVideos = [];
  let videoIndex = 1;
  for (const mediaUrl of videoUrls) {
    const saved = await downloadMedia(context.request, mediaUrl, videoDir, videoIndex, page.url());
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

  console.log("Saved " + downloadedImages.length + " images and " + downloadedVideos.length + " videos.");
  console.log("Folder: " + root);
  await context.close();
}

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const productUrl of args) {
    await importProduct(browser, productUrl);
  }
} catch (error) {
  console.error("\nTemu import failed.");
  console.error(error?.message || error);
  console.error("\nGoogle Chrome must be installed and Temu must open normally on this PC.");
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
