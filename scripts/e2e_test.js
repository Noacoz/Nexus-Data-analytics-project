const fs = require('fs');
let puppeteer;
try {
  puppeteer = require('puppeteer-core');
} catch(e) {
  puppeteer = require('puppeteer');
}

(async () => {
  const url = process.argv[2] || 'http://localhost:5174';
  const outDir = 'data/e2e';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const logs = [];
  let step = 0;

  function log(msg) {
    const text = `[step-${step}] ${msg}`;
    logs.push(text);
    console.log(text);
  }

  async function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  const exe = process.env.BROWSER_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const launchOpts = { args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (puppeteer && puppeteer.launch) {
    launchOpts.executablePath = exe;
  }

  try {
    const browser = await puppeteer.launch(launchOpts);
    const page = await browser.newPage();

    async function screenshot(name) {
      const path = `${outDir}/e2e-${step}-${name}.png`;
      await page.screenshot({ path, fullPage: true });
      log(`screenshot: ${path}`);
    }
    page.on('console', msg => {
      const text = `[console:${msg.type()}] ${msg.text()}`;
      logs.push(text);
    });
    page.on('pageerror', err => {
      const text = `[pageerror] ${err.stack || err.message || err}`;
      logs.push(text);
      console.error(text);
    });

    // === Step 1: Load home page ===
    step = 1;
    log('Loading home page...');
    const resp = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    log(`response: ${resp.status()} ${resp.url()}`);
    await delay(500);
    await screenshot('home-loaded');

    // === Step 2: Check page structure ===
    step = 2;
    log('Checking page structure...');
    const rootExists = await page.$('#root');
    const navExists = await page.$('nav');
    const mainExists = await page.$('main');
    log(`root: ${!!rootExists}, nav: ${!!navExists}, main: ${!!mainExists}`);
    await screenshot('page-structure');

    // === Step 3: Test login flow ===
    step = 3;
    log('Testing login flow...');
    let buttons = await page.$$('button, a');
    let getStartedBtn = null;
    for (let btn of buttons) {
      const text = (await page.evaluate(el => el.innerText || el.textContent, btn) || '').toLowerCase();
      if (text.includes('get started')) {
        getStartedBtn = btn;
        break;
      }
    }
    if (getStartedBtn) {
      log('Found "Get started" button, clicking...');
      await getStartedBtn.click();
      await delay(500);
      await screenshot('clicked-get-started');
    } else {
      log('No "Get started" button found');
    }

    // === Step 4: Check for login form ===
    step = 4;
    log('Looking for login form...');
    const emailInput = await page.$('input[id*="email"], input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]');
    const pwInput = await page.$('input[type="password"]');
    if (emailInput && pwInput) {
      log('Found email and password inputs');
      await emailInput.type('test@example.com', { delay: 50 });
      await pwInput.type('password123', { delay: 50 });
      log('Filled email and password');
      await screenshot('login-form-filled');

      // Look for login button
      buttons = await page.$$('button');
      let loginBtn = null;
      for (let btn of buttons) {
        const txt = (await page.evaluate(el => el.innerText || el.textContent, btn) || '').toLowerCase();
        if (txt.includes('login') || txt.includes('sign in')) {
          loginBtn = btn;
          break;
        }
      }
      if (loginBtn) {
        log('Found login button, clicking...');
        await loginBtn.click();
        await delay(1000);
        await screenshot('after-login');
      }
    } else {
      log('Login form not found on this step');
    }

    // === Step 5: Check for upload or main view ===
    step = 5;
    log('Checking main view...');
    const uploadBtnElements = await page.$$('button, a');
    let uploadBtn = null;
    for (let elem of uploadBtnElements) {
      const txt = (await page.evaluate(el => el.innerText || el.textContent, elem) || '').toLowerCase();
      if (txt.includes('upload')) {
        uploadBtn = elem;
        break;
      }
    }
    if (uploadBtn) {
      log('Found upload button');
      await screenshot('main-view');
    } else {
      log('No upload button visible');
    }

    // === Step 6: Test navigation ===
    step = 6;
    log('Testing navigation...');
    const navBtns = await page.$$('nav button, nav a');
    let navTexts = [];
    for (let btn of navBtns) {
      const txt = (await page.evaluate(el => el.innerText || el.textContent, btn) || '').trim();
      if (txt) navTexts.push(txt);
    }
    log(`Navigation items: ${navTexts.join(', ')}`);
    if (navBtns.length > 0) {
      await navBtns[0].click();
      await delay(500);
      log('Clicked first nav item');
      await screenshot('after-nav-click');
    }

    // === Step 7: Check localStorage (data persistence) ===
    step = 7;
    log('Checking localStorage...');
    const storageData = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key);
        if (key.startsWith('nexus_')) {
          items[key] = val.substring(0, 100);
        }
      }
      return items;
    });
    log(`localStorage nexus_* keys: ${JSON.stringify(storageData)}`);
    await screenshot('storage-check');

    // === Step 8: Test modal/dialog detection ===
    step = 8;
    log('Testing modal/dialog interactions...');
    const allBtns = await page.$$('button');
    let modalsFound = [];
    for (let i = 0; i < Math.min(allBtns.length, 3); i++) {
      const txt = (await page.evaluate(el => el.innerText || el.textContent, allBtns[i]) || '').trim().toLowerCase();
      const isInteractive = txt && (txt.includes('upload') || txt.includes('preferences') || txt.includes('report'));
      if (isInteractive) {
        await allBtns[i].click();
        await delay(300);
        const modal = await page.$('[role="dialog"], [aria-modal], .modal, input[type="file"]');
        if (modal) {
          modalsFound.push({ button: txt, found: true });
          log(`Modal found after clicking "${txt}"`);
          await screenshot(`modal-${txt}`);
        } else {
          modalsFound.push({ button: txt, found: false });
        }
      }
    }
    if (modalsFound.length > 0) {
      log(`Modals found: ${JSON.stringify(modalsFound)}`);
    }

    // === Step 9: Final check - render status ===
    step = 9;
    log('Final render status check...');
    const renderCheck = await page.evaluate(() => {
      return {
        bodyChildCount: document.body.children.length,
        rootHasChildren: !!document.getElementById('root') && document.getElementById('root').children.length > 0,
        visibleText: document.body.innerText.substring(0, 200),
      };
    });
    log(`Render check: ${JSON.stringify(renderCheck)}`);
    await screenshot('final-render');

    // === Cleanup ===
    await browser.close();
    fs.writeFileSync(`${outDir}/e2e-log.txt`, logs.join('\n'));
    log('E2E test complete');
    console.log('\n✅ E2E test completed successfully!');
    console.log(`Logs: ${outDir}/e2e-log.txt`);
    console.log(`Screenshots: ${outDir}/e2e-*.png`);
  } catch (err) {
    const text = `[fatal] ${err.stack || err.message || err}`;
    logs.push(text);
    console.error(text);
    fs.writeFileSync(`${outDir}/e2e-log.txt`, logs.join('\n'));
    process.exit(2);
  }
})();
