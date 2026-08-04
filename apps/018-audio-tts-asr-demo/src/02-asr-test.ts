import 'dotenv/config';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import tencentcloud from 'tencentcloud-sdk-nodejs';
import { env } from './env';

const AsrClient = tencentcloud.asr.v20190614.Client;
const AUDIO_FILE = fileURLToPath(new URL('../output.mp3', import.meta.url));

const client = new AsrClient({
  credential: {
    secretId: env.AUDIO_SECRET_ID,
    secretKey: env.AUDIO_SECRET_KEY,
  },
  region: 'ap-shanghai',
  profile: {
    httpProfile: {
      reqMethod: 'POST',
      reqTimeout: 30,
    },
  },
});

async function run() {
  const audioBase64 = fs.readFileSync(AUDIO_FILE).toString('base64');

  const params = {
    EngSerViceType: '16k_zh',
    SourceType: 1,
    Data: audioBase64,
    DataLen: Buffer.byteLength(audioBase64),
    VoiceFormat: 'mp3',
  };

  try {
    const data = await client.SentenceRecognition(params);
    console.log('识别结果：', data.Result);
  } catch (err) {
    console.error('识别失败：', err);
  }
}

run();
