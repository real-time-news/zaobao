import { v4 as uuidv4 } from "uuid";

export default async function parse(data: any) {
  //  Add a unique id to the data
  data = data.map((item: any) => {
    if (!item.uuid) {
      item.uuid = uuidv4();
    }
    return item;
  });

  return data;
}
