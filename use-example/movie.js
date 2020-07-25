const fs = require('fs');
const puppeteer = require('puppeteer');
const COS = require('cos-nodejs-sdk-v5');
const axios = require('axios');

(async () => {
  const getPrevMovieList = async () => {
    try {
      const response = await axios.get(`https://douban-1300076408.cos.ap-guangzhou.myqcloud.com/movieData.js`);
      return response.data;
    } catch (error) {
      console.log(`获取云端 movieData.js报错 ${error}`);
      return;
    }
  };

  const submitListData = async () => {
    const key = `movieData.js`;
    const cos = new COS({
      SecretId: 'AKIDiEUTDi7zlHXY73Ia8RVKthFYgYAZpaib',
      SecretKey: 'pQwDF7lALK4j9LH4f6JHAoEOIxOdcEiy',
    });
    cos.putObject(
      {
        Bucket: 'douban-1300076408',
        Region: 'ap-guangzhou',
        Key: key,
        StorageClass: 'STANDARD',
        Body: fs.createReadStream('./movieData.js'), // 上传文件对象
      },
      function (err, data) {
        return;
      }
    );
  };

  const startTask = async () => {
    //获取指定豆列链接中的电影列表
    const getMovieList = async () => {
      const outputArr = [];
      const movieArr = $('.doulist-item');

      for (let movieIndex = 0; movieIndex < movieArr.length; movieIndex++) {
        const resultMovie = {};
        const curItem = $(movieArr[movieIndex]);

        resultMovie.cover = curItem.find('.post img').attr('src');
        resultMovie.link = curItem.find('.post a').attr('href');
        resultMovie.name = curItem.find('.title').text().replace('播放全片', '').trim();
        const customText = curItem.find('.comment').text().replace('评语：', '').trim().split('\n');
        resultMovie.videoLink = '';
        resultMovie.authorWords = [];
        for (let textIndex = 0; textIndex < customText.length; textIndex++) {
          if (textIndex === 0) {
            resultMovie.videoLink = customText[textIndex];
          } else if (customText[textIndex]) {
            resultMovie.authorWords.push(customText[textIndex]);
          }
        }

        outputArr.push(resultMovie);
      }

      window.scrollTo(0, document.body.scrollHeight);

      return outputArr;
    };

    //获取电影的预告片
    const getPreVideo = async () => {
      return $($('video')[0]).find('source').attr('src');
    };

    //获取电影演员，图片等详细信息
    const getMovieDetail = async () => {
      const result = {};
      result.rating = $('.rating_num').text();
      const infoArr = $('#info').text().trim().split('\n');
      for (const item of infoArr) {
        if (item.indexOf('制片国家/地区') > -1) {
          result.country = item.split(':')[1];
        }
      }
      result.desc = $($('#link-report').find('span')[0]).text().trim();
      result.actor = [];
      const actorDomArr = $('.celebrity');
      for (let actorIndex = 0; actorIndex < actorDomArr.length; actorIndex++) {
        const item = $(actorDomArr[actorIndex]);
        const style = item.find('.avatar').attr('style');
        if (!style) {
          continue;
        }
        const actorImg = style.match(/\(([^)]*)\)/)[1];
        if (item.find('.role').text() !== '导演' && actorImg.indexOf('celebrity-default-medium') === -1) {
          result.actor.push({
            cover: actorImg,
            link: item.find('.name a').attr('href'),
            name: item.find('.name a').text(),
          });
        }
        if (result.actor.length === 4) {
          break;
        }
      }
      const picDomArr = $('.related-pic-bd li');
      result.preVideo = '';
      result.imgLinks = [];
      for (let picIndex = 0; picIndex < picDomArr.length; picIndex++) {
        const item = $(picDomArr[picIndex]);
        if (item.attr('class') === 'label-trailer') {
          result.preVideo = item.find('a').attr('href');
        } else if (item.attr('class') === 'label-short-video') {
          result.imgLinks.push(
            $(item)
              .find('a')
              .attr('style')
              .match(/(?<=\()(.*?)(?=\))/g)[0]
          );
        } else {
          result.imgLinks.push(item.find('img').attr('src'));
        }
      }
      result.preVideoPic =
        ($('.label-trailer').length &&
          $('.label-trailer')
            .find('a')
            .attr('style')
            .match(/\(([^)]*)\)/)[1]) ||
        '';
      return result;
    };

    const movieListLink = 'https://www.douban.com/doulist/121820536/?sort=time&start=0';

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(20000);

    const prevResult = await getPrevMovieList();
    const addedArr = [];

    const outputArr = prevResult.list;
    const initLength = outputArr.length;
    const exsitList = prevResult.exsitList;

    console.log('\n', `初始影视数量 ---${initLength}---`, '\n');
    try {
      console.log(`正在扫描影视列表 ${movieListLink}`);
      await page.goto(movieListLink);
      await page.waitForSelector('.doulist-item', { timeout: 10000 });
      let arr = await page.evaluate(getMovieList);

      //arr = [arr[0]];
      for (const item of arr) {
        if (!exsitList.includes(item.link)) {
          addedArr.push(item);
        } else {
          for (let oldItem of outputArr) {
            if (oldItem.name === item.name) {
              oldItem = Object.assign(oldItem, item);
            }
          }
        }
      }
    } catch (error) {
      console.log(`扫描影视列表报错 ${error}`);
      await page.waitFor(3000);
    }

    console.log(`新扫描到的影视数量 ${addedArr.length}`);

    for (let movieItem of addedArr) {
      try {
        console.log('\n', `正在扫描影视内容 ${movieItem.link}`);
        await page.goto(movieItem.link);
        await page.waitFor(500);
        await page.waitForSelector('#content', { timeout: 10000 });
        const detail = await page.evaluate(getMovieDetail);

        if (detail.preVideo) {
          console.log(`正在扫描影视预告片 ${movieItem.link}`);
          await page.goto(detail.preVideo);
          await page.waitFor(500);
          detail.preVideo = await page.evaluate(getPreVideo);
        }

        movieItem = Object.assign(movieItem, detail);

        if (!exsitList.includes(movieItem.link)) {
          outputArr.push(movieItem);
          exsitList.push(movieItem.link);
        } else {
          continue;
        }
      } catch (error) {
        console.log(`扫描影视内容报错 ${error}`);
        await page.waitFor(3000);
        continue;
      }
    }

    //关闭浏览器
    await browser.close();

    outputArr.sort((a, b) => {
      return parseFloat(b.rating) - parseFloat(a.rating);
    });

    const addedCount = outputArr.length - initLength;

    console.log('\n', `最终上传的影视数量 ---${outputArr.length}---`, '\n');

    console.log('\n', `新增影视数量 ---${addedCount}---`, '\n');

    const output = {
      list: outputArr,
      exsitList: exsitList,
      updateTime: new Date().getTime(),
    };
    fs.writeFile(`./movieData.js`, JSON.stringify(output), function (error) {
      console.log('本地 movieData.js 生成成功', '\n');
      submitListData().then(() => {
        console.log('云端 movieData.js 上传成功');
        return;
      });
    });
  };

  /* async function intervalFunc () {
    await startTask();
  }
  setInterval(intervalFunc, 3 * 60 * 1000); */

  await startTask();
})();
