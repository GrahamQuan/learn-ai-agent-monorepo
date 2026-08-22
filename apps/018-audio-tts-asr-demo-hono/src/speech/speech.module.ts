import { SpeechController } from './speech.controller';
import { SpeechService } from './speech.service';
import { TtsRelayService } from './tts-relay.service';

export class SpeechModule {
  constructor(
    readonly speechService: SpeechService,
    readonly speechController: SpeechController,
    readonly ttsRelayService: TtsRelayService,
  ) {}
}
