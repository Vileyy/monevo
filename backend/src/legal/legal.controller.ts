import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_LEGAL_OPTIONS,
  LegalPageOptions,
  renderAccountDeletion,
  renderPrivacyPolicy,
  renderTermsOfService,
} from './legal.content';

const HTML_CONTENT_TYPE = 'text/html; charset=utf-8';

@Controller('legal')
export class LegalController {
  constructor(private readonly configService: ConfigService) {}

  private getOptions(): LegalPageOptions {
    return {
      appName:
        this.configService.get<string>('LEGAL_APP_NAME') ||
        DEFAULT_LEGAL_OPTIONS.appName,
      operatorName:
        this.configService.get<string>('LEGAL_OPERATOR_NAME') ||
        DEFAULT_LEGAL_OPTIONS.operatorName,
      contactEmail:
        this.configService.get<string>('LEGAL_CONTACT_EMAIL') ||
        DEFAULT_LEGAL_OPTIONS.contactEmail,
      country:
        this.configService.get<string>('LEGAL_COUNTRY') ||
        DEFAULT_LEGAL_OPTIONS.country,
      lastUpdated:
        this.configService.get<string>('LEGAL_LAST_UPDATED') ||
        DEFAULT_LEGAL_OPTIONS.lastUpdated,
    };
  }

  @Get()
  @Header('Content-Type', HTML_CONTENT_TYPE)
  index(): string {
    return renderPrivacyPolicy(this.getOptions());
  }

  @Get('privacy')
  @Header('Content-Type', HTML_CONTENT_TYPE)
  privacy(): string {
    return renderPrivacyPolicy(this.getOptions());
  }

  @Get('terms')
  @Header('Content-Type', HTML_CONTENT_TYPE)
  terms(): string {
    return renderTermsOfService(this.getOptions());
  }

  @Get('account-deletion')
  @Header('Content-Type', HTML_CONTENT_TYPE)
  accountDeletion(): string {
    return renderAccountDeletion(this.getOptions());
  }
}
