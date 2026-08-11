import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const templateNames = ['invite.html', 'recovery.html', 'password-changed.html'];

function readTemplate(name: string) {
  return readFileSync(resolve(process.cwd(), 'supabase', 'templates', name), 'utf8');
}

describe('auth email branding', () => {
  it.each(templateNames)('uses Luxa as the product name in %s', (templateName) => {
    const template = readTemplate(templateName);

    expect(template).not.toMatch(/Luxa[ -]Operations?/i);
    expect(template).toContain('https://luxa-dashboard.vercel.app/luxa-logo.png');
  });

  it('attributes invitations to Luxa Solutions without personal inviter data', () => {
    const invitation = readTemplate('invite.html');

    expect(invitation).toMatch(/Luxa\s+Solutions has invited you/);
    expect(invitation).not.toContain('invited_by_name');
  });
});
