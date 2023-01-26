import { ChatProviderIdEnum, PushProviderIdEnum } from '../../consts';
import { EnvironmentId, ExternalSubscriberId, OrganizationId } from '../../types';

interface IChannelCredentials {
  webhookUrl?: string;
  deviceTokens?: string[];
  chatUserId?: string;
  secret?: string;
}

interface IChannelSettings {
  _integrationId: string;
  providerId: ChatProviderIdEnum | PushProviderIdEnum;
  credentials: IChannelCredentials;
}

export class SubscriberDto {
  _id: string;
  _organizationId: OrganizationId;
  _environmentId: EnvironmentId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
  locale?: string;
  subscriberId: ExternalSubscriberId;
  channels?: IChannelSettings[];
  deleted: boolean;
}
