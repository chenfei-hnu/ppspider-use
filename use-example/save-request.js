const puppeteer = require('puppeteer');
const HAR = require('puppeteer-har');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const har = new HAR(page);
  await har.start({ path: 'results.har' });
  await page.goto('http://localhost:8080');
  await har.stop();
  await browser.close();
})();