const puppeteer = require('puppeteer');
var fs = require('fs');

(async () => {
  const broswer = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const prevContent = fs.readFileSync('prevContent.js').toString();

  const page = await broswer.newPage();
  try {
    await page.goto('http://localhost:8080/');
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url === 'http://localhost:8080/api/locations') {
        request.respond({
          status: 200,
          contentType: 'application/json; charset=utf-8',
          body:
            '{"retcode":0,"message":"","data":{"list":[{"id":38,"ctime":1590749075,"mtime":1590749075,"merchant_id":198,"name":"231","parent_id":0,"level":1,"remark":"","status":2,"sort_weight":-200000,"children":[{"id":39,"ctime":1590749080,"mtime":1590749080,"merchant_id":198,"name":"3213","parent_id":38,"level":2,"remark":"","status":2,"sort_weight":100000,"children":[]}]},{"id":33,"ctime":1590741559,"mtime":1590742120,"merchant_id":198,"name":"亚洲","parent_id":0,"level":1,"remark":"","status":2,"sort_weight":-100000,"children":[{"id":34,"ctime":1590742124,"mtime":1590742124,"merchant_id":198,"name":"中国","parent_id":33,"level":2,"remark":"","status":2,"sort_weight":100000,"children":[{"id":35,"ctime":1590742131,"mtime":1590742131,"merchant_id":198,"name":"广东","parent_id":34,"level":3,"remark":"","status":2,"sort_weight":100000,"children":[{"id":36,"ctime":1590742137,"mtime":1590742137,"merchant_id":198,"name":"深圳","parent_id":35,"level":4,"remark":"","status":2,"sort_weight":100000,"children":[{"id":37,"ctime":1590742144,"mtime":1590742144,"merchant_id":198,"name":"南山区","parent_id":36,"level":5,"remark":"","status":2,"sort_weight":100000,"children":[]}]}]}]}]},{"id":31,"ctime":1590741548,"mtime":1590741548,"merchant_id":198,"name":"222","parent_id":0,"level":1,"remark":"","status":2,"sort_weight":0,"children":[{"id":32,"ctime":1590741551,"mtime":1590741551,"merchant_id":198,"name":"333","parent_id":31,"level":2,"remark":"","status":2,"sort_weight":100000,"children":[]}]},{"id":30,"ctime":1590736658,"mtime":1590736658,"merchant_id":198,"name":"111","parent_id":0,"level":1,"remark":"","status":2,"sort_weight":100000,"children":[]}]}}',
        });
      } else {
        request.continue();
      }
    });

    await page.waitForSelector('.ant-form', { timeout: 10000 });
    await page.type('#userName', 'songq9003'); //立即输入
    await page.type('#password', '123456', {
      delay: 100,
    }); //模拟用户输入
    await page.click('button[type=submit]'); //点击登录按钮

    await page.waitForSelector('.global-popover-user-name-content', { timeout: 10000 });

    await page.click('a[href="/inventory/myLocations"]');
    await page.waitForSelector('.name-column .name', { timeout: 10000 });

    const scPageElement = await page.$('.sc-page .ant-table');
    const innerHTML = await (await scPageElement.getProperty('innerHTML')).jsonValue();
    if (!prevContent) {
      fs.writeFile(`./prevContent.js`, innerHTML, function (error) {
        console.log('prevContent.js 生成成功', '\n');
      });
    } else {
      console.log(`UI测试对比结果 ${innerHTML === prevContent}`);
    }
    await page.waitFor(3000);
    broswer.close();
  } catch (error) {
    console.log(error);
  }
})();
