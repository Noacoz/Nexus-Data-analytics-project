const fs = require('fs');
let puppeteer;
try{
  puppeteer = require('puppeteer-core');
}catch(e){
  puppeteer = require('puppeteer');
}

(async ()=>{
  const url = process.argv[2] || 'http://localhost:5000';
  const outDir = 'data';
  if(!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const screenshotPath = `${outDir}/nexus_headless_screenshot.png`;
  const logsPath = `${outDir}/nexus_headless_console.log`;
  const logs = [];

  const exe = process.env.BROWSER_PATH || process.argv[3] || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const launchOpts = {args:['--no-sandbox','--disable-setuid-sandbox']};
  if(puppeteer && puppeteer.launch){
    launchOpts.executablePath = exe;
  }
  const browser = await puppeteer.launch(launchOpts);
  const page = await browser.newPage();

  page.on('console', msg => {
    const text = `[console:${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });
  page.on('pageerror', err => {
    const text = `[pageerror] ${err.stack || err.message || err}`;
    logs.push(text);
    console.error(text);
  });
  page.on('requestfailed', req => {
    const text = `[requestfailed] ${req.url()} ${req.failure() && req.failure().errorText}`;
    logs.push(text);
    console.warn(text);
  });

  try{
    console.log(`Navigating to ${url}...`);
    const resp = await page.goto(url, {waitUntil: 'networkidle2', timeout: 30000});
    logs.push(`[response] ${resp && resp.status()} ${resp && resp.url()}`);
    
    // Wait for React to hydrate
    await new Promise(r => setTimeout(r, 2000));
    
    // Check if React is loaded
    const reactLoaded = await page.evaluate(() => {
      return {
        hasRoot: !!document.getElementById('root'),
        hasChildren: document.getElementById('root')?.children?.length > 0,
        hasReact: typeof window.React !== 'undefined' || !!document.querySelector('[data-reactroot]')
      };
    });
    
    logs.push('[react] ' + JSON.stringify(reactLoaded));
    console.log('[react]', reactLoaded);
    
    await page.screenshot({path: screenshotPath, fullPage: true});
    logs.push('[screenshot] saved ' + screenshotPath);
    
    // Simple smoke test - check if page loaded
    if (resp && resp.status() === 200 && reactLoaded.hasRoot) {
      console.log('✅ Page loaded successfully');
    } else {
      throw new Error('Page failed to load properly');
    }
    
  }catch(e){
    const text = `[error] ${e.stack || e.message || e}`;
    logs.push(text);
    console.error(text);
    await browser.close();
    fs.writeFileSync(logsPath, logs.join('\n'));
    process.exit(2);
  }

  await browser.close();
  fs.writeFileSync(logsPath, logs.join('\n'));
  console.log('Headless check complete. Logs:', logsPath, 'Screenshot:', screenshotPath);
  
  const hasErrors = logs.some(l=>l.startsWith('[pageerror]') || l.includes('Uncaught') || l.includes('ReferenceError') || l.includes('TypeError'));
  process.exit(hasErrors?1:0);
})();
