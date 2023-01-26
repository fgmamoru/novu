import {
  ChannelTypeEnum,
  ISendMessageSuccessResponse,
  IChatOptions,
  IChatProvider,
} from '@novu/stateless';
import jws from 'jws';
import axios from 'axios';

export class WebhookChatProvider implements IChatProvider {
  channelType = ChannelTypeEnum.CHAT as ChannelTypeEnum.CHAT;
  id = 'webhook';
  private axiosInstance = axios.create();

  constructor(private config: Record<string, never>) {}

  async sendMessage(
    options: IChatOptions
  ): Promise<ISendMessageSuccessResponse> {
    console.log('sendMessage!!!!');
    console.log('sendMessage', options);
    console.log('sendMessage', this.config);
    const url: string = options.webhookUrl;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const secret: string = options.secret;

    const sign = jws.sign({
      header: { alg: 'HS256' },
      payload: { content: options.content },
      secret: secret,
    });

    const headers = {
      'x-signature': sign,
      'content-type': this.getContentTypeHeader(options.content),
    };

    const response = await this.axiosInstance.request({
      headers,
      method: 'POST',
      url,
      data: options.content,
    });

    return {
      id: response.data.message_id,
      date: response.data.date,
    };
  }
  getContentTypeHeader(content: string) {
    if (this.isJson(content)) {
      return 'application/json';
    }

    return 'text/plain';
  }

  isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }

    return true;
  }
}
