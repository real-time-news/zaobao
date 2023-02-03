import fs from "fs";
import puppeteer from "puppeteer";
import dayjs from "dayjs";
import parse from "./parse";
import path from "path";

const date = dayjs().format("YYYY-MM-DD");

// 通用方法
const common = async (workFunc) => {
  const startTime = +new Date();
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  typeof workFunc === "function" && (await workFunc(page));
  await page.close();
  await browser.close();
  console.log("方法结束，耗费时长：", +new Date() - startTime);
};

// 爬虫方法
const crawler = async (urls: any, selectors: any) => {
  const list = [] as any;
  const len = urls.length;
  // 通用方法 传入一个异步方法 该方法中可以使用page 该方法会自动打开浏览器并关闭浏览器 保证每次都是新的浏览器 也可以保证每次都是新的页面 保证每次都是新的上下文 保证每次都是新的cookie
  await common(async (page: any) => {
    // 递归方法
    async function runOnce(i) {
      const url = urls[i];
      await page.goto(url);
      // 通过evaluate方法可以在浏览器中执行js代码 该方法返回一个promise
      const result = await page.evaluate((selectors) => {
        const res = [] as any;

        selectors.forEach((selector) => {
          const { key, value, field } = selector;
          const domList = document.querySelectorAll(value);
          Array.prototype.slice
            .apply(domList)
            .forEach((dom: any, index: number) => {
              const newVal = dom[field] || dom.innerText || "";

              res[index] = res[index] || {};

              res[index][key] = newVal;
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
    key: "title",
    value: "div.f18.m-eps",
    field: "outerText",
  },
  {
    key: "time",
    value: "div.text-tip-color.pdt10",
    field: "textContent",
  },
];

const urls2 = ["https://www.zaobao.com/realtime/china/story20230203-1359245"];

const selectors2 = [
  {
    key: "title",
    value: "meta[name=description]",
    field: "content",
  },
];

// crawler(urls, selectors).then(async (result) => {
//   const parseResult = await parse(result);
//   console.log(parseResult);
// });

crawler(urls, selectors).then(async (result) => {
  const parseResult = await parse(result);

  console.log(parseResult);

  const filePath = path.resolve(__dirname, `../data/${date}.json`);

  fs.readFile(filePath, "utf-8", (err, fileData) => {
    if (!fileData) {
      // create file
      fs.writeFile(filePath, JSON.stringify([]), "utf-8", (err) => {
        if (err) {
          console.log(err);
        }
      });
    } else {
      const oldData = JSON.parse(fileData);
      const newData = [...oldData];

      const reverseResult = parseResult.reverse();

      reverseResult.forEach((item: any) => {
        const isExist = newData.some((item2) => item2.title === item.title);
        if (!isExist) {
          newData.unshift(item);
        }
      });

      // write file
      fs.writeFile(filePath, JSON.stringify(newData), "utf-8", (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  });
});
