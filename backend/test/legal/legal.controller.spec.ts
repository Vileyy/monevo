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
                LEGAL_CONTACT_EMAIL: 'privacy@example.com',
                LEGAL_LAST_UPDATED: '2026-10-22',
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
    expect(html).toContain('Clerk');
    expect(html).toContain('/legal/account-deletion');
  });

  it('renders the terms of service', () => {
    const html = controller.terms();

    expect(html).toContain('Terms of Service');
    expect(html).toContain('not a bank');
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
