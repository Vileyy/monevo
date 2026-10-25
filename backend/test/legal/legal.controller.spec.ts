import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LegalController } from '../../src/legal/legal.controller';

describe('LegalController', () => {
  let controller: LegalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LegalController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const values: Record<string, string> = {
                LEGAL_APP_NAME: 'Monevo',
                LEGAL_OPERATOR_NAME: 'Jane Doe',
                LEGAL_CONTACT_EMAIL: 'privacy@example.com',
                LEGAL_COUNTRY: 'Vietnam',
                LEGAL_LAST_UPDATED: '2026-10-25',
              };
              return values[key];
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<LegalController>(LegalController);
  });

  it('renders the privacy policy with real contact details', () => {
    const html = controller.privacy();

    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('privacy@example.com');
    expect(html).toContain('Jane Doe');
    expect(html).toContain('/legal/account-deletion');
  });

  it('discloses every third party required by the Play Data Safety form', () => {
    const html = controller.privacy();

    for (const provider of [
      'Clerk',
      'Google',
      'PostHog',
      'Sentry',
      'Amazon Web Services',
    ]) {
      expect(html).toContain(provider);
    }
    expect(html).toContain('analytics');
  });

  it('renders the terms of service with a governing law', () => {
    const html = controller.terms();

    expect(html).toContain('Terms of Service');
    expect(html).toContain('not a bank');
    expect(html).toContain('Governing law');
    expect(html).toContain('laws of Vietnam');
    expect(html).toContain('/legal/privacy');
  });

  it('renders the account deletion instructions', () => {
    const html = controller.accountDeletion();

    expect(html).toContain('Delete your account');
    expect(html).toContain('Profile');
    expect(html).toContain('privacy@example.com');
  });

  it('serves the privacy policy at the legal root', () => {
    expect(controller.index()).toBe(controller.privacy());
  });
});
