import OSS from 'ali-oss';
import { env } from './env.js';

async function main() {
  const config = {
    region: 'oss-cn-beijing',
    bucket: 'agent-bucket123',
    accessKeyId: env.OSS_ACCESS_KEY_ID,
    accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
  };

  const client = new OSS(config);

  const date = new Date();

  date.setDate(date.getDate() + 1);

  const res = client.calculatePostSignature({
    expiration: date.toISOString(),
    conditions: [
      ['content-length-range', 0, 1048576000], //设置上传文件的大小限制。
    ],
  });

  console.log(res);

  const location = await (client.getBucketLocation as (name?: string) => Promise<{ location: string }>)();

  const host = `http://${config.bucket}.${location.location}.aliyuncs.com`;

  console.log(host);
}

main();
