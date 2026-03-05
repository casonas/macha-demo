const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '../..');
const BASE_URL = process.env.E2E_BASE_URL || 'http://127.0.0.1:4173';
const TEST_EMAIL = process.env.E2E_TEST_EMAIL || 'mfa-e2e-placeholder@example.com';
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD || 'Password1';
const TEST_PHONE = process.env.E2E_TEST_PHONE || '5551234567';
const TEST_MFA_CODE = process.env.E2E_TEST_MFA_CODE || '123456';
const USE_EXISTING_SERVER = process.env.E2E_USE_EXISTING_SERVER === 'true';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/login`);
      if (res.ok) return;
    } catch {
      // server not ready yet
    }
    await delay(1000);
  }
  throw new Error(`Timed out waiting for dev server at ${url}`);
}

function clickByText(page, text) {
  return page.evaluate((targetText) => {
    const all = Array.from(document.querySelectorAll('button, a'));
    const match = all.find((el) => el.textContent && el.textContent.trim() === targetText);
    if (!match) throw new Error(`Could not find clickable element with text: ${targetText}`);
    match.click();
  }, text);
}

async function fill(page, selector, value) {
  await page.waitForSelector(selector, { visible: true });
  await page.click(selector, { clickCount: 3 });
  await page.type(selector, value);
}

async function waitForPath(page, pathname, timeout = 30000) {
  await page.waitForFunction(
    (targetPath) => window.location.pathname === targetPath,
    { timeout },
    pathname
  );
}

async function existsByText(page, text) {
  return page.evaluate((targetText) =>
    Array.from(document.querySelectorAll('button, a, h1, h2, h3, p, span')).some(
      (el) => (el.textContent || '').trim() === targetText
    ),
  text);
}

async function run() {
  let devServer;
  if (!USE_EXISTING_SERVER) {
    devServer = spawn('npm', ['start'], {
      cwd: ROOT,
      env: {
        ...process.env,
        BROWSER: 'none',
        CI: 'true',
        PORT: '4173',
        REACT_APP_DATA_PROVIDER: process.env.REACT_APP_DATA_PROVIDER || 'mock',
      },
      stdio: 'inherit',
    });
    await waitForServer(BASE_URL);
  }

  const browser = await puppeteer.launch({
    headless: true,
    userDataDir: path.join(os.tmpdir(), 'macha-e2e-auth-profile'),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto(`${BASE_URL}/create-account`, { waitUntil: 'networkidle2' });

    await fill(page, 'input[placeholder="John Doe"]', 'E2E User');
    await fill(page, 'input[placeholder="john@example.com"]', TEST_EMAIL);
    await fill(page, 'input[placeholder="(555) 123-4567"]', TEST_PHONE);
    await fill(page, 'input[placeholder="Min 8 chars, 1 upper, 1 number"]', TEST_PASSWORD);
    await fill(page, 'input[placeholder="Re-enter password"]', TEST_PASSWORD);
    await clickByText(page, 'Create Account');

    await waitForPath(page, '/mfa-setup');
    if (await existsByText(page, "I've Verified My Email")) {
      await clickByText(page, "I've Verified My Email");
      await page.waitForSelector('input[placeholder="(555) 123-4567"]', { visible: true });
    }
    await fill(page, 'input[placeholder="(555) 123-4567"]', TEST_PHONE);
    await clickByText(page, 'Send Verification Code');
    try {
      await page.waitForSelector('input[placeholder="Enter 6-digit code"]', { visible: true, timeout: 30000 });
    } catch (err) {
      const pageText = await page.evaluate(() => document.body.innerText);
      throw new Error(`MFA code input did not appear after enrollment SMS step.\n${pageText}\n${String(err)}`);
    }
    await fill(page, 'input[placeholder="Enter 6-digit code"]', TEST_MFA_CODE);
    await clickByText(page, 'Verify & Continue');

    await waitForPath(page, '/home');
    await clickByText(page, 'Sign out');
    await waitForPath(page, '/login');

    await fill(page, 'input[placeholder="Enter your email"]', TEST_EMAIL);
    await fill(page, 'input[placeholder="Enter your password"]', TEST_PASSWORD);
    await clickByText(page, 'Sign In');

    await page.waitForSelector('input[placeholder="Enter 6-digit code"]', { visible: true });
    await fill(page, 'input[placeholder="Enter 6-digit code"]', TEST_MFA_CODE);
    await clickByText(page, 'Verify & Sign In');
    await waitForPath(page, '/home');

    await page.reload({ waitUntil: 'networkidle2' });
    await waitForPath(page, '/home');
    const hasMfaPrompt = await page.evaluate(() =>
      Array.from(document.querySelectorAll('h1')).some((el) =>
        (el.textContent || '').includes('Verification Required')
      )
    );
    if (hasMfaPrompt) {
      throw new Error('Expected authenticated session after reload, but MFA prompt was shown again.');
    }

    await clickByText(page, 'Sign out');
    await waitForPath(page, '/login');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } finally {
    await browser.close();
    if (devServer) {
      devServer.kill('SIGTERM');
    }
  }
}

run().catch((err) => {
  console.error('[auth-persistence.e2e] FAILED:', err);
  process.exitCode = 1;
});
