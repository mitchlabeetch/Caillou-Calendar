const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  
  // click everywhere
  try {
     await page.evaluate(() => {
        document.querySelectorAll('button').forEach(btn => btn.click());
     });
     console.log('clicked buttons');
  } catch(e) {}
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('done testing');
  await browser.close();
  process.exit(0);
})();
