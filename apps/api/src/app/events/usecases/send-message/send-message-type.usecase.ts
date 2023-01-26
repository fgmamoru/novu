import { MessageEntity, MessageRepository, NotificationEntity } from '@novu/dal';
import { LogCodeEnum } from '@novu/shared';
import { CreateLog } from '../../../logs/usecases';
import { SendMessageCommand } from './send-message.command';
import * as Sentry from '@sentry/node';
import { CreateExecutionDetails } from '../../../execution-details/usecases/create-execution-details/create-execution-details.usecase';

export abstract class SendMessageType {
  protected constructor(
    protected messageRepository: MessageRepository,
    protected createLogUsecase: CreateLog,
    protected createExecutionDetails: CreateExecutionDetails
  ) {}

  public abstract execute(command: SendMessageCommand);

  protected async sendErrorStatus(
    message: MessageEntity,
    status: 'error' | 'sent' | 'warning',
    errorId: string,
    errorMessageFallback: string,
    command: SendMessageCommand,
    notification: NotificationEntity,
    logCodeEnum: LogCodeEnum,
    error?: any
  ) {
    const errorString =
      stringifyObject(error?.response?.body) ||
      stringifyObject(error?.response) ||
      stringifyObject(error) ||
      errorMessageFallback;

    if (error) {
      Sentry.captureException(errorString);
    }

    await this.messageRepository.updateMessageStatus(
      command.environmentId,
      message._id,
      status,
      null,
      errorId,
      errorString
    );
  }
}

function stringifyObject(error: any): string {
  if (!error) return '';

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof String) {
    return error.toString();
  }

  if (Object.keys(error)?.length > 0) {
    return JSON.stringify(error);
  }

  return '';
}
