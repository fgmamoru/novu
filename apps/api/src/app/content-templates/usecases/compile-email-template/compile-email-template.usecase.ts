import { Injectable, NotFoundException } from '@nestjs/common';
import { IEmailBlock, OrganizationRepository, OrganizationEntity } from '@novu/dal';
import { CompileTemplate } from '../compile-template/compile-template.usecase';
import { CompileTemplateCommand } from '../compile-template/compile-template.command';
import { ApiException } from '../../../shared/exceptions/api.exception';
import * as fs from 'fs';
import { merge } from 'lodash';
import { CompileEmailTemplateCommand } from './compile-email-template.command';
import { GetLayoutCommand, GetLayoutUseCase } from '../../../layouts/usecases';
import { VerifyPayloadService } from '../../../shared/helpers/verify-payload.service';
import { LayoutDto } from '../../../layouts/dtos';
import { GetNovuLayout } from '../../../layouts/usecases/get-novu-layout/get-novu-layout.usecase';
import { readFile } from 'fs/promises';

@Injectable()
export class CompileEmailTemplate {
  constructor(
    private compileTemplate: CompileTemplate,
    private organizationRepository: OrganizationRepository,
    private getLayoutUsecase: GetLayoutUseCase,
    private getNovuLayoutUsecase: GetNovuLayout
  ) {}

  public async execute(command: CompileEmailTemplateCommand) {
    const verifyPayloadService = new VerifyPayloadService();
    const organization = await this.organizationRepository.findById(command.organizationId);
    if (!organization) throw new NotFoundException(`Organization ${command.organizationId} not found`);

    const isEditorMode = command.contentType === 'editor';

    let layout: LayoutDto | null = null;
    let layoutContent: string | null = null;

    if (command.layoutId) {
      layout = await this.getLayoutUsecase.execute(
        GetLayoutCommand.create({
          layoutId: command.layoutId,
          environmentId: command.environmentId,
          organizationId: command.organizationId,
        })
      );

      layoutContent = layout.content;
    } else if (isEditorMode && !command.layoutId) {
      layoutContent = await this.getNovuLayoutUsecase.execute({});
    }

    const layoutVariables = layout?.variables || [];
    const defaultPayload = verifyPayloadService.verifyPayload(layoutVariables, command.payload);

    let helperBlocksContent: string | null = null;
    if (isEditorMode) {
      helperBlocksContent = await this.loadTemplateContent('basic.handlebars');
    }

    let subject = '';
    const content: string | IEmailBlock[] = command.content;
    let preheader = command.preheader;

    command.payload = merge({}, defaultPayload, command.payload);

    const payload = {
      ...command.payload,
      subject: command.subject,
      preheader,
      blocks: [],
      branding: {
        logo: organization.branding?.logo,
        color: organization.branding?.color || '#f47373',
      },
    };

    try {
      subject = await this.renderContent(command.subject, payload);

      if (preheader) {
        preheader = await this.renderContent(preheader, payload);
      }
    } catch (e) {
      throw new ApiException(e?.message || `Message content could not be generated`);
    }

    const customLayout = CompileEmailTemplate.addPreheader(layoutContent as string);

    const templateVariables = {
      ...payload,
      subject,
      preheader,
      body: '',
      blocks: isEditorMode ? content : [],
    };

    if (isEditorMode) {
      for (const block of content as IEmailBlock[]) {
        block.content = await this.renderContent(block.content, payload);
        block.url = await this.renderContent(block.url || '', payload);
      }
    }

    const body = await this.compileTemplate.execute(
      CompileTemplateCommand.create({
        template: !isEditorMode ? (content as string) : (helperBlocksContent as string),
        data: templateVariables,
      })
    );

    templateVariables.body = body as string;

    const html = customLayout
      ? await this.compileTemplate.execute(
          CompileTemplateCommand.create({
            template: customLayout,
            data: templateVariables,
          })
        )
      : body;

    return { html, content, subject };
  }

  private async renderContent(content: string, payload: Record<string, unknown>) {
    const renderedContent = await this.compileTemplate.execute(
      CompileTemplateCommand.create({
        template: content,
        data: {
          ...payload,
        },
      })
    );

    return renderedContent?.trim() || '';
  }

  public static addPreheader(content: string): string {
    // "&nbsp;&zwnj;&nbsp;&zwnj;" is needed to spacing away the rest of the email from the preheader area in email clients
    return content?.replace(
      /<body[^>]*>/g,
      `$&{{#if preheader}}
          <div style="display: none; max-height: 0px; overflow: hidden;">
            {{preheader}}
            &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;
          </div>
        {{/if}}`
    );
  }

  private async loadTemplateContent(name: string) {
    let path = '';
    if (!process.env.E2E_RUNNER) {
      path = '/src/app/content-templates/usecases/compile-email-template';
    }

    const content = await readFile(`${__dirname}${path}/templates/${name}`);

    return content.toString();
  }
}
