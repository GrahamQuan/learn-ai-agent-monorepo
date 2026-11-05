import type { db } from '../db';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

export class ConversationsModule {
  readonly controller: ConversationsController;
  constructor(em: typeof db) {
    this.controller = new ConversationsController(new ConversationsService(em));
  }
}
