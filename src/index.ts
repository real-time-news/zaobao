import fs from "fs";
import puppeteer from "puppeteer";

// 通用方法
const common = async (workFunc) => {
  const startTime = +new Date();
  console.log(`进入方法`);
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  typeof workFunc === "function" && (await workFunc(page));
  await page.close();
  await browser.close();
  console.log("方法结束，耗费时长：", +new Date() - startTime);
};

// 爬虫方法
const crawler = async (urls: any, selectors: any) => {
  const list = [];
  const len = urls.length;
  // 通用方法 传入一个异步方法 该方法中可以使用page 该方法会自动打开浏览器并关闭浏览器 保证每次都是新的浏览器 也可以保证每次都是新的页面 保证每次都是新的上下文 保证每次都是新的cookie
  await common(async (page: any) => {
    // 递归方法
    async function runOnce(i) {
      const url = urls[i];
      await page.goto(url);
      // 通过evaluate方法可以在浏览器中执行js代码 该方法返回一个promise
      const result = await page.evaluate((selectors) => {
        const res = [];

        selectors.forEach((selector) => {
          const { key, value, field } = selector;
          const domList = document.querySelectorAll(value);
          Array.prototype.slice
            .apply(domList)
            .forEach((dom: any, index: number) => {
              const newVal = dom[field] || dom.innerText || "";
              res[index] = res[index] || {};

              if (res[index][key]) {
                res[index][key] = newVal;
              }

              // res[index][key] = newVal;
            });
        });

        return res;
      }, selectors);

      list.push(...result);

      if (i < len - 1) {
        await runOnce(i + 1);
      }
    }

    await runOnce(0);
  });

  return list;
};

// 使用
const urls = ["https://www.zaobao.com/realtime/china"];
const selectors = [
  {
    key: "标题",
    value: "#main-container .f18.m-eps",
    field: "outerText",
  },
  {
    key: "时间",
    value: "#main-container .text-tip-color.pdt10",
    field: "innerText",
  },
  // {
  //   key: "类型",
  //   value: ".article tbody tr > td:nth-child(3)",
  //   field: "innerText",
  // },
  // {
  //   key: "制片国家 / 地区",
  //   value: ".article tbody tr > td:nth-child(4)",
  //   field: "innerText",
  // },
  // {
  //   key: "想看",
  //   value: ".article tbody tr > td:nth-child(5)",
  //   field: "innerText",
  // },
];

// 爬取豆瓣电影
crawler(urls, selectors).then((result) => {
  console.log(result);
  // 写入文件
  fs.writeFile("豆瓣电影.json", JSON.stringify(result), "utf-8", (err) => {
    if (err) {
      console.log(err);
    }
  });
});
