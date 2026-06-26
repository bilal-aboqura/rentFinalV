import { describe, it, expect } from 'vitest';
import { ContactFormSchema } from '@/lib/validation/contact';

describe('Contact validation schema', () => {
  it('should validate valid contact form inputs', () => {
    const result = ContactFormSchema.safeParse({
      name: 'John Doe',
      email: 'john.doe@example.com',
      subject: 'General Question',
      message: 'Hello, I have a question about your services.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john.doe@example.com');
      expect(result.data.subject).toBe('General Question');
      expect(result.data.message).toBe('Hello, I have a question about your services.');
    }
  });

  it('should reject names that are too long or empty', () => {
    const emptyResult = ContactFormSchema.safeParse({
      name: '',
      email: 'john@example.com',
      subject: 'Subject',
      message: 'Message content',
    });
    expect(emptyResult.success).toBe(false);
    if (!emptyResult.success) {
      expect(emptyResult.error.issues[0].message).toContain('name');
    }

    const longResult = ContactFormSchema.safeParse({
      name: 'A'.repeat(101),
      email: 'john@example.com',
      subject: 'Subject',
      message: 'Message content',
    });
    expect(longResult.success).toBe(false);
  });

  it('should reject invalid email formats', () => {
    const result = ContactFormSchema.safeParse({
      name: 'John Doe',
      email: 'invalid-email',
      subject: 'Subject',
      message: 'Message content',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('email');
    }
  });

  it('should reject subjects that are too long or empty', () => {
    const emptyResult = ContactFormSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      subject: '',
      message: 'Message content',
    });
    expect(emptyResult.success).toBe(false);

    const longResult = ContactFormSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'A'.repeat(151),
      message: 'Message content',
    });
    expect(longResult.success).toBe(false);
  });

  it('should reject messages that are too long or empty', () => {
    const emptyResult = ContactFormSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Subject',
      message: '',
    });
    expect(emptyResult.success).toBe(false);

    const longResult = ContactFormSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Subject',
      message: 'A'.repeat(3001),
    });
    expect(longResult.success).toBe(false);
  });
});
