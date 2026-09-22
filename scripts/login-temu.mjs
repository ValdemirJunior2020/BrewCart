import { chromium } from "playwright-core";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";

const userDataDir = path.join(process.cwd(), ".temu-browser-profile");

let context;

try {
  context = await chromium.launchPersistentContext(userDataDir, {
    channel: "chrome",
    headless: false,
    viewport: { width: 1365, height: 900 },
    locale: "en-US"
  });

  const pages = context.pages();
  const page = pages[0] || await context.newPage();

  await page.goto("https://www.temu.com/", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  console.log("");
  console.log("============================================================");
  console.log(" TEMU LOGIN WINDOW IS OPEN");
  console.log("============================================================");
  console.log("");
  console.log("1. Log into Temu in the Chrome window.");
  console.log("2. Make sure you can open a Temu product page.");
  console.log("3. COME BACK TO THIS BLACK WINDOW.");
  console.log("4. Press ENTER only after you are fully logged in.");
  console.log("");
  console.log("Chrome will stay open until YOU press Enter here.");
  console.log("");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  await rl.question("Press ENTER after Temu login is complete...");
  rl.close();

  console.log("");
  console.log("Login session saved.");
  console.log("You can now run IMPORT-MY-3-TEMU-PRODUCTS.bat");
  console.log("");
} catch (error) {
  console.error("");
  console.error("Temu login setup failed.");
  console.error(error?.message || error);
  process.exitCode = 1;
} finally {
  if (context) await context.close();
}
