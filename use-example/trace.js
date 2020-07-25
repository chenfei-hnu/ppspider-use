const puppeteer = require('puppeteer');

(async () => {
  const broswer = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await broswer.newPage();
  try {
    await page.tracing.start({
      path: 'trace.json',
    });
    await page.goto('http://localhost:8080/');
    await page.waitForSelector('.ant-form', { timeout: 10000 });
    await page.type('#userName', 'ling.lan'); //立即输入
    await page.type('#password', '1234567', {
      delay: 100,
    }); //模拟用户输入
    await page.click('button[type=submit]'); //点击登录按钮

    await page.waitForSelector('.global-popover-user-name-content', { timeout: 10000 });

    await page.tracing.stop();
  } catch (error) {
    console.log(error);
  }
  await broswer.close();
})();
