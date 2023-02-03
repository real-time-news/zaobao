import { v4 as uuidv4 } from "uuid";
import cheerio from "cheerio";
import fetch from "node-fetch";

export default async function parse(list: any) {
  const fetchDescription = async (link: string) => {
    return fetch(`https://www.zaobao.com.sg${link}`)
      .then(async (res: any) => res.text())
      .then((body: any) => {
        const $ = cheerio.load(body);
        const description = $("meta[name=description]").attr("content");
        return description;
      });
  };

  const mapAsync = async (list: []) => {
    const asyncResult = await Promise.all(
      list.map(async (item: any) => {
        if (!item.uuid) {
          item.uuid = uuidv4();
        }
        if (!item.summary) {
          item.summary = await fetchDescription(item.link);
        }

        return item;
      })
    );

    return asyncResult;
  };

  const result = await mapAsync(list);

  return result;
}
