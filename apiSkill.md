1.waitForFunction 自定义等待方法

eg：等到表格行中出现期望的字符串

第二个参数为options，可以设置polling执行的时间间隔 timeout超时时间
第三个参数为args，可以设置函数执行需要的参数

const waitRowByName = (name: string) => {
  const nameColumns = document.querySelectorAll('.ant-table-row');

  for (let index = 0; index < nameColumns.length; index += 1) {
    const item = nameColumns[index];
    if (item.innerHTML.includes(name)) {
      return index + 1;
    }
  }
  return false;
};

const returnJSHandle = await page.waitForFunction(waitRowByName, {}, docConfig.context.locationName);
const newRecordIndex = await returnJSHandle.jsonValue();

2.属性选择器备忘
await page.click('[type='button']');
await page.click('a[href="/inventory/myLocations"]');