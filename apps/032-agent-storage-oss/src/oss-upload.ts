import OSS from 'ali-oss';
import fs from 'fs';
import { env } from './env.js';

const { oss } = env;

const client = new OSS({
  // yourRegion填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
  region: oss.OSS_REGION,
  accessKeyId: oss.OSS_ACCESS_KEY_ID,
  accessKeySecret: oss.OSS_ACCESS_KEY_SECRET,
  authorizationV4: true,
  bucket: oss.OSS_BUCKET,
});

async function putStream() {
  try {
    // 使用chunked encoding。使用putStream接口时，SDK默认会发起一个chunked encoding的HTTP PUT请求。
    let stream = fs.createReadStream('./zao.png');
    // 填写Object完整路径，例如exampledir/exampleobject.txt。Object完整路径中不能包含Bucket名称。
    let result = await client.putStream('aaa/bbb/first.png', stream);
    console.log(result);
  } catch (e) {
    console.log(e);
  }
}

putStream();
