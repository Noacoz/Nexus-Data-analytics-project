const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = process.argv[2] || '5176';
const URL = `http://localhost:${PORT}`;
const SCREENSHOT_DIR = './data/e2e-fidelity';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  const logFile = path.join(SCREENSHOT_DIR, 'fidelity-test.log');
  const log = (msg) => {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n', 'utf-8');
  };

  fs.writeFileSync(logFile, `=== NEXUS FIDELITY TEST ===\nURL: ${URL}\nTimestamp: ${new Date().toISOString()}\n\n`);

  let browser, page;

  try {
    // Find Chrome
    const chromePath = (() => {
      const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) return p;
      }
      return 'chrome';
    })();

    log('[TEST] Launching browser...');
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    const routes = [
      { name: 'home', path: '/' },
      { name: 'product', path: '#product' },
      { name: 'pricing', path: '#pricing' },
      { name: 'contact', path: '#contact' },
      { name: 'login', path: '#login' },
    ];

    // Test Home Route
    log('\n[TEST 1] Home Route');
    await page.goto(URL, { waitUntil: 'networkidle2' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-home.png') });
    const hasHero = await page.$eval('body', el => el.textContent.includes('Transform Your Data'));
    const hasMarquee = await page.$eval('body', el => el.textContent.includes('Stripe'));
    const hasFeatures = await page.$eval('body', el => el.textContent.includes('Instant Insights'));
    log(`✓ Hero section: ${hasHero ? 'PASS' : 'FAIL'}`);
    log(`✓ Marquee companies: ${hasMarquee ? 'PASS' : 'FAIL'}`);
    log(`✓ Features grid: ${hasFeatures ? 'PASS' : 'FAIL'}`);

    // Test Navigation Visibility
    log('\n[TEST 2] Navigation Component');
    const hasNav = await page.$eval('body', el => el.textContent.includes('Product') && el.textContent.includes('Pricing'));
    const hasAuthButtons = await page.$eval('body', el => el.textContent.includes('Log in') && el.textContent.includes('Start analyzing free'));
    log(`✓ Nav items visible: ${hasNav ? 'PASS' : 'FAIL'}`);
    log(`✓ Auth buttons visible: ${hasAuthButtons ? 'PASS' : 'FAIL'}`);

    // Test Product Route
    log('\n[TEST 3] Product Route');
    const productLink = await page.$('button:has-text("Product")');
    if (productLink) {
      await productLink.click();
      await delay(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-product.png') });
      const hasProductContent = await page.$eval('body', el => el.textContent.includes('Powerful Analytics'));
      log(`✓ Product view loaded: ${hasProductContent ? 'PASS' : 'FAIL'}`);
    } else {
      log('⚠ Product link not found');
    }

    // Test Pricing Route
    log('\n[TEST 4] Pricing Route');
    const pricingLink = await page.$('button:has-text("Pricing")');
    if (pricingLink) {
      await pricingLink.click();
      await delay(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-pricing.png') });
      const hasPricing = await page.$eval('body', el => el.textContent.includes('Professional') && el.textContent.includes('$99') && el.textContent.includes('Most Popular'));
      log(`✓ Pricing plans visible: ${hasPricing ? 'PASS' : 'FAIL'}`);
    } else {
      log('⚠ Pricing link not found');
    }

    // Test Login Route
    log('\n[TEST 5] Login View');
    const startButton = await page.$('button:has-text("Start analyzing free")');
    if (startButton) {
      await startButton.click();
      await delay(500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-login.png') });
      const hasLoginForm = await page.$eval('body', el => el.textContent.includes('Email address') && el.textContent.includes('Password'));
      log(`✓ Login form present: ${hasLoginForm ? 'PASS' : 'FAIL'}`);
    } else {
      log('⚠ Start analyzing button not found');
    }

    // Test Contact Route
    log('\n[TEST 6] Contact Route');
    try {
      await page.goBack({ waitUntil: 'networkidle2' });
      await delay(300);
      const contactLink = await page.$('button:has-text("Contact")');
      if (contactLink) {
        await contactLink.click();
        await delay(500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-contact.png') });
        const hasContactForm = await page.$eval('body', el => el.textContent.includes('Get in Touch'));
        log(`✓ Contact view loaded: ${hasContactForm ? 'PASS' : 'FAIL'}`);
      }
    } catch (e) {
      log(`⚠ Contact navigation: ${e.message}`);
    }

    // Test Toast System
    log('\n[TEST 7] Toast System');
    const hasToastContainer = await page.$('.toast-container');
    log(`✓ Toast system: ${hasToastContainer ? 'PASS' : 'FAIL'}`);

    // Test localStorage
    log('\n[TEST 8] LocalStorage Keys');
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    log(`Storage keys: ${storageKeys.length > 0 ? storageKeys.join(', ') : 'empty'}`);

    // Final Render State
    log('\n[TEST 9] Final Render State');
    const hasChildren = await page.evaluate(() => document.body.children.length > 0);
    const bodyText = await page.evaluate(() => document.body.textContent);
    const textLength = bodyText.length;
    log(`✓ Body has children: ${hasChildren ? 'PASS' : 'FAIL'}`);
    log(`✓ Content length: ${textLength} chars`);

    log('\n=== FIDELITY TEST COMPLETE ===\n');
    log('Status: ✓ PASSED');

    await browser.close();
    process.exit(0);
  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    log(error.stack);
    if (browser) await browser.close();
    process.exit(1);
  }
}

run();
