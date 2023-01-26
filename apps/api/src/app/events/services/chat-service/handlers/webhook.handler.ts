import { ICredentials } from '@novu/dal';
import { ChannelTypeEnum } from '@novu/stateless';
import { BaseChatHandler } from './base.handler';
import { WebhookChatProvider } from '@novu/webhookProvider';

export class WebhookHandler extends BaseChatHandler {
  constructor() {
    super('webhook', ChannelTypeEnum.CHAT);
  }

  buildProvider(_credentials: ICredentials) {
    this.provider = new WebhookChatProvider({});
  }
}
