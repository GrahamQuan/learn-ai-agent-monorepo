import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { SpeechService } from './speech.service';

type UploadedAudio = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

export class SpeechController {
  readonly routes = new Hono();

  constructor(private readonly speechService: SpeechService) {
    this.routes.post('/asr', async (c) => {
      const body = await c.req.parseBody();
      const audio = body.audio;
      const file =
        audio instanceof File
          ? {
              buffer: Buffer.from(await audio.arrayBuffer()),
              originalname: audio.name,
              mimetype: audio.type,
              size: audio.size,
            }
          : undefined;
      return c.json(await this.recognize(file));
    });
  }

  async recognize(file?: UploadedAudio) {
    if (!file?.buffer?.length) {
      throw new HTTPException(400, {
        message: '请通过 FormData 的 audio 字段上传音频文件',
      });
    }

    const text = await this.speechService.recognizeBySentence(file);
    return { text };
  }
}
