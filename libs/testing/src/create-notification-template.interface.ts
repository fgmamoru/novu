import {
  IEmailBlock,
  ITemplateVariable,
  StepTypeEnum,
  IPreferenceChannels,
  DigestTypeEnum,
  DigestUnitEnum,
  DelayTypeEnum,
} from '@novu/shared';
import { NotificationTemplateEntity, StepFilter } from '@novu/dal';

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface CreateTemplatePayload extends Omit<NotificationTemplateEntity, 'steps'> {
  noFeedId?: boolean;
  preferenceSettingsOverride?: IPreferenceChannels;
  steps: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cta?: any;
    active?: boolean;
    subject?: string;
    title?: string;
    contentType?: 'editor' | 'customHtml';
    filters?: StepFilter[];
    content: string | IEmailBlock[];
    variables?: ITemplateVariable[];
    name?: string;
    type: StepTypeEnum;
    replyCallback?: {
      active: boolean;
      url: string;
    };
    metadata?: {
      amount?: number;
      unit?: DigestUnitEnum;
      digestKey?: string;
      type: DigestTypeEnum | DelayTypeEnum;
      delayPath?: string;
      backoffUnit?: DigestUnitEnum;
      backoffAmount?: number;
      updateMode?: boolean;
    };
  }[];
}
