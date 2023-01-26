import { Inject, Injectable } from '@nestjs/common';
import { IntegrationEntity, IntegrationRepository, OrganizationEntity, OrganizationRepository } from '@novu/dal';
import { GetNovuIntegrationCommand } from './get-novu-integration.command';
import { ChannelTypeEnum, EmailProviderIdEnum } from '@novu/shared';
import {
  CalculateLimitNovuIntegration,
  CalculateLimitNovuIntegrationCommand,
} from '../calculate-limit-novu-integration';
import { ANALYTICS_SERVICE } from '../../../shared/shared.module';
import { AnalyticsService } from '@novu/application-generic';

@Injectable()
export class GetNovuIntegration {
  constructor(
    private integrationRepository: IntegrationRepository,
    private calculateLimitNovuIntegration: CalculateLimitNovuIntegration,
    private organizationRepository: OrganizationRepository,
    @Inject(ANALYTICS_SERVICE) private analyticsService: AnalyticsService
  ) {}

  async execute(command: GetNovuIntegrationCommand): Promise<IntegrationEntity | undefined> {
    if (!process.env.NOVU_EMAIL_INTEGRATION_API_KEY) {
      return;
    }

    const activeIntegrationsCount = await this.integrationRepository.count({
      _organizationId: command.organizationId,
      active: true,
      channel: command.channelType,
      _environmentId: command.environmentId,
    });

    if (activeIntegrationsCount > 0) {
      return;
    }

    const limit = await this.calculateLimitNovuIntegration.execute(
      CalculateLimitNovuIntegrationCommand.create({
        channelType: command.channelType,
        organizationId: command.organizationId,
        environmentId: command.environmentId,
      })
    );

    if (!limit) {
      return;
    }

    if (limit.count >= limit.limit) {
      this.analyticsService.track('[Novu Integration] - Limit reached', command.userId, {
        channelType: command.channelType,
        organizationId: command.organizationId,
        environmentId: command.environmentId,
        providerId: CalculateLimitNovuIntegration.getProviderId(command.channelType),
        ...limit,
      });
      // add analytics event.
      throw new Error(`Limit for Novus ${command.channelType.toLowerCase()} provider was reached.`);
    }

    const organization = await this.organizationRepository.findById(command.organizationId);

    switch (command.channelType) {
      case ChannelTypeEnum.EMAIL:
        return this.createNovuEmailIntegration(organization);
      default:
        return undefined;
    }
  }

  private createNovuEmailIntegration(organization: OrganizationEntity | null): IntegrationEntity {
    const item = new IntegrationEntity();
    item.providerId = EmailProviderIdEnum.Novu;
    item.active = true;
    item.channel = ChannelTypeEnum.EMAIL;

    item.credentials = {
      apiKey: process.env.NOVU_EMAIL_INTEGRATION_API_KEY,
      from: 'no-reply@novu.co',
      senderName: organization !== null ? organization.name : 'Novu',
    };

    return item;
  }

  public static mapProviders(type: ChannelTypeEnum, providerId: string) {
    if (![EmailProviderIdEnum.Novu.toString()].includes(providerId)) {
      return providerId;
    }

    switch (type) {
      case ChannelTypeEnum.EMAIL:
        return EmailProviderIdEnum.SendGrid;
      default:
        return providerId;
    }
  }
}
