import { IsDefined, IsOptional, IsString } from 'class-validator';
import { IEmailBlock } from '@novu/shared';
import { NotificationStepEntity, JobEntity } from '@novu/dal';
import { EnvironmentWithUserCommand } from '../../../shared/commands/project.command';

export class SendMessageCommand extends EnvironmentWithUserCommand {
  @IsDefined()
  @IsString()
  identifier: string;

  @IsDefined()
  payload: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  @IsDefined()
  overrides: Record<string, Record<string, unknown>>;

  @IsDefined()
  step: NotificationStepEntity;

  @IsString()
  @IsDefined()
  transactionId: string;

  @IsDefined()
  notificationId: string;

  @IsDefined()
  subscriberId: string;

  @IsDefined()
  jobId: string;

  @IsOptional()
  events?: any[];

  @IsDefined()
  job: JobEntity;
}

export class TestSendMessageCommand extends EnvironmentWithUserCommand {
  @IsDefined()
  contentType: 'customHtml' | 'editor';
  @IsDefined()
  payload: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  @IsDefined()
  @IsString()
  subject: string;
  preheader?: string;
  @IsDefined()
  content: string | IEmailBlock[];
  @IsDefined()
  to: string | string[];
  @IsOptional()
  @IsString()
  layoutId?: string | null;
}
