import { EventEmitter } from 'node:events';
import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveStatic } from '@hono/node-server/serve-static';
import { ChatOpenAI } from '@langchain/openai';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';
import { AiController } from './ai/ai.controller';
import { AiModule } from './ai/ai.module';
import { AiService } from './ai/ai.service';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AI_TTS_STREAM_EVENT, type AiTtsStreamEvent } from './common/stream-events';
import { ControllerService } from './controller/controller.service';
import { env } from './env';
import { SpeechController } from './speech/speech.controller';
import { SpeechModule } from './speech/speech.module';
import { SpeechService } from './speech/speech.service';
import { TtsRelayService } from './speech/tts-relay.service';

const AsrClient = tencentcloud.asr.v20190614.Client;

export class AppModule {
  readonly app = new Hono();
  readonly eventEmitter = new EventEmitter();
  readonly appController: AppController;
  readonly aiModule: AiModule;
  readonly speechModule: SpeechModule;
  readonly controllerService: ControllerService;

  private readonly aiTtsStreamListener: (event: AiTtsStreamEvent) => void;

  constructor() {
    this.eventEmitter.setMaxListeners(200);

    const appService = new AppService();
    this.appController = new AppController(appService);
    this.controllerService = new ControllerService();

    const model = new ChatOpenAI({
      model: env.MODEL_NAME,
      apiKey: env.OPENAI_API_KEY,
      configuration: { baseURL: env.OPENAI_BASE_URL },
    });
    const aiService = new AiService(model, this.eventEmitter);
    const aiController = new AiController(aiService, this.eventEmitter);
    this.aiModule = new AiModule(model, aiService, aiController);

    const asrClient = new AsrClient({
      credential: {
        secretId: env.SECRET_ID,
        secretKey: env.SECRET_KEY,
      },
      region: 'ap-shanghai',
      profile: {
        httpProfile: {
          reqMethod: 'POST',
          reqTimeout: 30,
        },
      },
    });
    const speechService = new SpeechService(asrClient);
    const speechController = new SpeechController(speechService);
    const ttsRelayService = new TtsRelayService(env);
    this.speechModule = new SpeechModule(speechService, speechController, ttsRelayService);

    this.aiTtsStreamListener = (event) => ttsRelayService.handleAiStreamEvent(event);
    this.eventEmitter.on(AI_TTS_STREAM_EVENT, this.aiTtsStreamListener);

    const publicDirectory = relative(process.cwd(), fileURLToPath(new URL('../public', import.meta.url)));
    this.app.use('*', cors());
    this.app.use('/*', serveStatic({ root: publicDirectory }));
    this.app.route('/', this.appController.routes);
    this.app.route('/ai', aiController.routes);
    this.app.route('/speech', speechController.routes);
  }

  close() {
    this.eventEmitter.off(AI_TTS_STREAM_EVENT, this.aiTtsStreamListener);
    this.speechModule.ttsRelayService.onModuleDestroy();
  }
}
