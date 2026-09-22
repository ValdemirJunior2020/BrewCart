import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { Builder } from "selenium-webdriver";
import firefox from "selenium-webdriver/firefox.js";

const urls = process.argv.slice(2).filter(Boolean);

if (!urls.length) {
  console.error("No Temu product URL supplied.");
  process.exit(1);
}

function productIdFromUrl(value) {
  return value.match(/-g-(\d+)\.html/i)?.[1] || ("temu-" + Date.now());
}

function getFirefoxBinary() {
  const candidates = [
    process.env.FIREFOX_BIN,
    "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
    "C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe",
    path.join(process.env.LOCALAPPDATA || "", "Mozilla Firefox", "firefox.exe")
  ].filter(Boolean);

  return candidates.find((candidate) => existsSync(candidate)) || null;
}

function normalizeUrl(value, baseUrl) {
  if (!value || typeof value !== "string") return null;

  const cleaned = value
    .trim()
    .replaceAll("\\u002F", "/")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&");

  if (!cleaned || cleaned.startsWith("data:") || cleaned.startsWith("blob:")) return null;

  try {
    return new URL(cleaned, baseUrl).href;
  } catch {
    return null;
  }
}

function isProductImage(value) {
  try {
    const url = new URL(value);
    return url.hostname.endsWith("kwcdn.com") && url.pathname.includes("/product/");
  } catch {
    return false;
  }
}

function isVideo(value) {
  try {
    const url = new URL(value);
    return /\.(mp4|webm|m3u8)$/i.test(url.pathname) || url.pathname.includes("/video/");
  } catch {
    return false;
  }
}

function canonical(value) {
  try {
    const url = new URL(value);
    return url.origin + url.pathname;
  } catch {
    return value;
  }
}

function extractUrls(html) {
  return html
    .replaceAll("\\u002F", "/")
    .replaceAll("\\/", "/")
    .replaceAll("&amp;", "&")
    .match(/https?:\/\/[^"'<>\s]+/g) || [];
}

function extensionFor(type, mediaUrl, kind) {
  const clean = (type || "").split(";")[0].toLowerCase();

  const known = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "application/vnd.apple.mpegurl": ".m3u8",
    "application/x-mpegurl": ".m3u8"
  };

  if (known[clean]) return known[clean];

  try {
    const ext = path.extname(new URL(mediaUrl).pathname);
    if (ext && ext.length <= 6) return ext;
  } catch {}

  return kind === "image" ? ".jpg" : ".mp4";
}

async function saveMedia(mediaUrl, folder, index, referer, kind) {
  try {
    const response = await fetch(mediaUrl, {
      headers: {
        Referer: referer,
        "User-Agent": "Mozilla/5.0"
      }
    });

    if (!response.ok) return null;

    const type = response.headers.get("content-type") || "";

    if (kind === "image" && !type.startsWith("image/")) return null;

    if (
      kind === "video" &&
      !type.startsWith("video/") &&
      !type.includes("mpegurl")
    ) return null;

    const filename =
      String(index).padStart(3, "0") +
      extensionFor(type, mediaUrl, kind);

    await fs.writeFile(
      path.join(folder, filename),
      Buffer.from(await response.arrayBuffer())
    );

    return { filename, sourceUrl: mediaUrl, contentType: type };
  } catch {
    return null;
  }
}

async function collectPageMedia(driver) {
  return await driver.executeScript(function () {
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
        for (const part of srcset.split(",")) {
          add(images, part.trim().split(/\s+/)[0]);
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
      pageUrl: location.href,
      images: [...images],
      videos: [...videos],
      resources: performance.getEntriesByType("resource").map((entry) => entry.name)
    };
  });
}

async function importProduct(driver, productUrl) {
  const productId = productIdFromUrl(productUrl);
  const root = path.join(process.cwd(), "data", "imports", productId);
  const imageDir = path.join(root, "images");
  const videoDir = path.join(root, "videos");

  await fs.rm(root, { recursive: true, force: true });
  await fs.mkdir(imageDir, { recursive: true });
  await fs.mkdir(videoDir, { recursive: true });

  console.log("");
  console.log("Loading product " + productId + "...");

  await driver.get(productUrl);
  await driver.sleep(7000);

  const currentUrl = await driver.getCurrentUrl();

  if (/temu\.com\/login\.html/i.test(currentUrl)) {
    throw new Error(
      "Temu is not logged in in BrewCart's Firefox profile. Run LOGIN-TEMU-FIRST.bat, log in, CLOSE Firefox completely, then retry."
    );
  }

  for (let i = 0; i < 12; i += 1) {
    await driver.executeScript("window.scrollBy(0,650)");
    await driver.sleep(350);
  }

  await driver.executeScript("window.scrollTo(0,0)");
  await driver.sleep(1000);

  const dom = await collectPageMedia(driver);
  const html = await driver.getPageSource();

  const imageMap = new Map();

  for (const raw of [...dom.images, ...dom.resources, ...extractUrls(html)]) {
    const normalized = normalizeUrl(raw, dom.pageUrl);
    if (!normalized || !isProductImage(normalized)) continue;
    if (!imageMap.has(canonical(normalized))) {
      imageMap.set(canonical(normalized), normalized);
    }
  }

  const videoMap = new Map();

  for (const raw of [...dom.videos, ...dom.resources, ...extractUrls(html)]) {
    const normalized = normalizeUrl(raw, dom.pageUrl);
    if (!normalized || !isVideo(normalized)) continue;
    if (!videoMap.has(canonical(normalized))) {
      videoMap.set(canonical(normalized), normalized);
    }
  }

  const images = [];
  let imageIndex = 1;

  for (const mediaUrl of imageMap.values()) {
    const saved = await saveMedia(mediaUrl, imageDir, imageIndex, dom.pageUrl, "image");
    if (saved) {
      images.push(saved);
      imageIndex += 1;
    }
  }

  const videos = [];
  let videoIndex = 1;

  for (const mediaUrl of videoMap.values()) {
    const saved = await saveMedia(mediaUrl, videoDir, videoIndex, dom.pageUrl, "video");
    if (saved) {
      videos.push(saved);
      videoIndex += 1;
    }
  }

  const manifest = {
    importedAt: new Date().toISOString(),
    source: "Temu",
    supplierProductId: productId,
    supplierUrl: productUrl,
    finalPageUrl: dom.pageUrl,
    pageTitle: dom.title,
    imageCount: images.length,
    videoCount: videos.length,
    images,
    videos
  };

  await fs.writeFile(
    path.join(root, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  console.log("Saved " + images.length + " product images and " + videos.length + " videos.");
  console.log("Folder: " + root);
}

const firefoxBinary = getFirefoxBinary();

if (!firefoxBinary) {
  console.error("Installed Firefox was not found.");
  process.exit(1);
}

const profileDir = path.join(process.cwd(), ".temu-firefox-profile");

if (!existsSync(profileDir)) {
  console.error("Temu Firefox profile was not found.");
  console.error("Run LOGIN-TEMU-FIRST.bat first.");
  process.exit(1);
}

const options = new firefox.Options();
options.setBinary(firefoxBinary);
options.setProfile(profileDir);

let driver;

try {
  driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .build();

  for (const productUrl of urls) {
    await importProduct(driver, productUrl);
  }
} catch (error) {
  console.error("");
  console.error("Temu import failed.");
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  if (driver) {
    await driver.quit();
  }
}
