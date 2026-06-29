/**
 * T003 — Contact Form Zod Validation Schema Unit Tests
 *
 * Verifies the validation rules for ContactFormSchema and
 * UpdateInquiryStatusSchema (Spec 010 — Feature F-10).
 *
 * Spec: specs/010-contact-inquiries/contracts/server-actions.md
 */

import { describe, it, expect } from 'vitest';
import {
  ContactFormSchema,
  UpdateInquiryStatusSchema,
  INQUIRY_STATUSES,
} from '@/lib/validation/contact';

const validContact = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  subject: 'Custom route inquiry',
  message: 'I would like to request pricing for a custom route.',
};

const VALID_UUID = '00000000-0000-0000-0000-000000000001';

// ─────────────────────────────────────────────────────────────
// ContactFormSchema
// ─────────────────────────────────────────────────────────────

describe('ContactFormSchema — contact form validation (US1)', () => {
  it('accepts a valid full payload', () => {
    const result = ContactFormSchema.safeParse(validContact);
    expect(result.success).toBe(true);
  });

  it('rejects an empty name', () => {
    const result = ContactFormSchema.safeParse({ ...validContact, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
      expect(errors.name[0]).toContain('required');
    }
  });

  it('rejects a name exceeding 100 characters', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      name: 'x'.repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
      expect(errors.name[0]).toContain('100');
    }
  });

  it('rejects an empty email', () => {
    const result = ContactFormSchema.safeParse({ ...validContact, email: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
      expect(errors.email[0]).toContain('required');
    }
  });

  it('rejects a malformed email', () => {
    const result = ContactFormSchema.safeParse({ ...validContact, email: 'not-an-email' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
      expect(errors.email[0]).toContain('valid email');
    }
  });

  it('rejects an empty subject', () => {
    const result = ContactFormSchema.safeParse({ ...validContact, subject: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
      expect(errors.subject[0]).toContain('required');
    }
  });

  it('rejects a subject exceeding 150 characters', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      subject: 'x'.repeat(151),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
      expect(errors.subject[0]).toContain('150');
    }
  });

  it('rejects an empty message', () => {
    const result = ContactFormSchema.safeParse({ ...validContact, message: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
      expect(errors.message[0]).toContain('required');
    }
  });

  it('rejects a message exceeding 3000 characters', () => {
    const result = ContactFormSchema.safeParse({
      ...validContact,
      message: 'x'.repeat(3001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors as Record<string, string[]>;
      expect(errors.message[0]).toContain('3000');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// UpdateInquiryStatusSchema
// ─────────────────────────────────────────────────────────────

describe('UpdateInquiryStatusSchema — status update validation (US3)', () => {
  it('accepts a valid inquiryId and status', () => {
    INQUIRY_STATUSES.forEach((status) => {
      const result = UpdateInquiryStatusSchema.safeParse({
        inquiryId: VALID_UUID,
        status,
      });
      expect(result.success).toBe(true);
    });
  });

  it('rejects an invalid inquiryId (not a UUID)', () => {
    const result = UpdateInquiryStatusSchema.safeParse({
      inquiryId: 'not-a-uuid',
      status: 'Read',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status value', () => {
    const result = UpdateInquiryStatusSchema.safeParse({
      inquiryId: VALID_UUID,
      status: 'Archived',
    });
    expect(result.success).toBe(false);
  });
});
