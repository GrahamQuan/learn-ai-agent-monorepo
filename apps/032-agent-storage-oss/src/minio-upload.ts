import fs from 'fs';
import * as Minio from 'minio';
import { env } from './env.js';

const { minio } = env;

const minioClient = new Minio.Client({
  endPoint: 'localhost',
  port: 9000,
  useSSL: false,
  accessKey: minio.MINIO_ACCESS_KEY,
  secretKey: minio.MINIO_SECRET_KEY,
});

async function putStream() {
  try {
    const stream = fs.createReadStream('./zao.png');
    const result = await minioClient.putObject('aaa', 'ccc/ddd/hello.png', stream);
    console.log(result);
    console.log('上传成功');
  } catch (err) {
    console.log(err);
  }
}

putStream();
