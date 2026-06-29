import type { Models } from '../src/models/types.js';

export async function up(models: Models): Promise<void> {
  const { Content } = models;

  const items = [
    {
      key: 'hero_title',
      value: 'Reliable Airport Transfers, On Time Every Time',
      description: 'Homepage hero section title',
    },
    {
      key: 'hero_subtitle',
      value: 'Book your flat-rate ride to or from the airport in under a minute.',
      description: 'Homepage hero subtitle',
    },
    {
      key: 'contact_email',
      value: 'support@airporttransfers.com',
      description: 'Public contact email',
    },
    {
      key: 'contact_phone',
      value: '+1 (555) 010-2030',
      description: 'Public contact phone',
    },
    {
      key: 'faq_1',
      value: JSON.stringify({
        question: 'How do I cancel my booking?',
        answer: 'Contact us at least 24 hours before your trip for free cancellation.',
      }),
      description: 'FAQ entry 1',
    },
    {
      key: 'faq_2',
      value: JSON.stringify({
        question: 'Do you offer child seats?',
        answer: 'Yes, request a child seat in the booking notes or contact support.',
      }),
      description: 'FAQ entry 2',
    },
    {
      key: 'faq_3',
      value: JSON.stringify({
        question: 'What vehicle classes are available?',
        answer: 'Standard, Executive, and Van options for every supported route.',
      }),
      description: 'FAQ entry 3',
    },
  ];

  for (const item of items) {
    const exists = await Content.findOne({ where: { key: item.key } });
    if (!exists) {
      await Content.create(item);
    }
  }
}
