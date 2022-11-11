### Sample code to implement remote bag file parse

```typescript
const open = async (file: File | string) => {
  if (!(file instanceof Blob)) {
    throw new Error(
      "Expected file to be a File or Blob. Make sure you are correctly importing the node or web version of Bag."
    );
  }
  const bag = new Bag(new BagReader(new Reader(file)));
  await bag.open();
  return bag;
};
Bag.open = open;

let blob_bag: any;
window.bagfile.arrayBuffer().then((res) => {
  blob_bag = new Blob([res]);
});


new Bag(new BagReader(new Reader(blob_bag)));
// or
const bagIns = new window.rosbag.default(new window.rosbag.BagReader(new window.rosbag.Reader(bb)));
bagIns.open()
```


### 如何获取 fetch 下载的进度
https://zh.javascript.info/fetch-progress

### 从 Fetch 到 Streams —— 以流的角度处理网络请求
https://ost.51cto.com/posts/3376