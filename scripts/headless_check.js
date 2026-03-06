const fs = require('fs');
let puppeteer;
try{
  puppeteer = require('puppeteer-core');
}catch(e){
  puppeteer = require('puppeteer');
}

(async ()=>{
  const url = process.argv[2] || 'http://localhost:5500/nexus_analytics_final.html';
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
    const resp = await page.goto(url, {waitUntil: 'networkidle2', timeout: 30000});
    logs.push(`[response] ${resp && resp.status()} ${resp && resp.url()}`);
    if (page.waitForTimeout && typeof page.waitForTimeout === 'function') {
        await page.waitForTimeout(1500);
    } else {
      await new Promise(r => setTimeout(r, 1500));
    }
      try{
        const info = await page.evaluate(()=>{
          function t(n){ try{ return typeof eval(n) }catch(e){ return 'error' } }
          const reactDefined = typeof window !== 'undefined' && typeof window.React !== 'undefined'
          const reactDomDefined = typeof window !== 'undefined' && typeof window.ReactDOM !== 'undefined'
          return {
            react: reactDefined ? 'object' : 'undefined',
            reactVersion: reactDefined && window.React && window.React.version ? window.React.version : null,
            reactDom_createRoot: reactDomDefined && typeof window.ReactDOM.createRoot === 'function' ? 'function' : (reactDomDefined ? typeof window.ReactDOM.createRoot : 'undefined'),
            reactDom_render: reactDomDefined && typeof window.ReactDOM.render === 'function' ? 'function' : (reactDomDefined ? typeof window.ReactDOM.render : 'undefined'),
            reactDom_createPortal: reactDomDefined && typeof window.ReactDOM.createPortal === 'function' ? 'function' : (reactDomDefined ? typeof window.ReactDOM.createPortal : 'undefined'),
            appType: typeof window.App,
            ToastProvider: t('ToastProvider'),
            ConfirmDialog: t('ConfirmDialog'),
            ToastContext: t('ToastContext'),
            useNotifications: t('useNotifications'),
            Notifications: t('Notifications'),
            rootExists: !!document.getElementById('root'),
            scripts: Array.from(document.scripts).slice(-6).map(s=> s.src || s.type || '(inline)')
          }
        })
        logs.push('[pageInfo] ' + JSON.stringify(info))
        console.log('[pageInfo]', info)
      }catch(e){ logs.push('[pageInfoError] '+ (e && e.message)) }
    await page.screenshot({path: screenshotPath, fullPage: true});
    logs.push('[screenshot] saved ' + screenshotPath);
    // --- smoke interactions: try clicking a top-level button and detect a modal/dialog ---
    try{
      const buttons = await page.$$('button, a');
      const targets = ['upload','upload dataset','upload dataset','preferences','reports','billing','dataset','get started','login'];
      let clicked = false;
      for(let i=0;i<buttons.length;i++){
        const text = (await page.evaluate(el=>el.innerText || el.textContent, buttons[i]) || '').toLowerCase().trim();
        if(!text) continue;
        if(targets.some(t=> text.includes(t))){
          await buttons[i].click();
          logs.push(`[smoke] clicked button: ${text}`);
          clicked = true;
          await page.waitForTimeout(700);
          break;
        }
      }
      if(!clicked) logs.push('[smoke] no matching button found');
      const modal = await page.$('input[type=file], [role="dialog"], [data-modal], .modal, [aria-modal]');
      if(modal) { logs.push('[smoke] detected modal/dialog after click') } else { logs.push('[smoke] no modal/dialog detected') }
    }catch(e){ logs.push('[smokeError] '+ (e && e.message)) }
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
