import {
  ChannelTypeEnum,
  ISendMessageSuccessResponse,
  IChatOptions,
  IChatProvider,
} from '@novu/stateless';
import { TwitterApi } from 'twitter-api-v2';

export class TwitterChatProvider implements IChatProvider {
  channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
  private twitterClient: TwitterApi;

  constructor(
    private config: {
      appKey: string;
      appSecret: string;
      accessToken: string;
      accessSecret: string;
    }
  ) {
    this.twitterClient = new TwitterApi({
      appKey: this.config.appKey,
      appSecret: this.config.appSecret,
      accessToken: this.config.accessToken,
      accessSecret: this.config.accessSecret,
    });
  }
  id = 'twitter';

  async sendMessage(
    options: IChatOptions
  ): Promise<ISendMessageSuccessResponse> {
    await this.twitterClient.v2.tweet({
      text: options.content,
    });

    return {
      date: new Date().toISOString(),
    };
  }
}
