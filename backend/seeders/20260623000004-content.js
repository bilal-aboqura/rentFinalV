'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const faq = (question, answer) =>
      JSON.stringify({ question, answer });

    await queryInterface.bulkInsert(
      'content',
      [
        {
          key: 'hero_title',
          value: 'Reliable Airport Transfers, On Time Every Time',
          description: 'Homepage hero headline',
          created_at: now,
          updated_at: now,
        },
        {
          key: 'hero_subtitle',
          value: 'Flat-rate pricing. Professional drivers. Book your ride in under a minute.',
          description: 'Homepage hero subtitle',
          created_at: now,
          updated_at: now,
        },
        {
          key: 'faq_1',
          value: faq('How do I book a transfer?', 'Choose your pickup and destination, select a vehicle class, and submit the form. You will receive a booking reference.'),
          description: 'FAQ entry 1',
          created_at: now,
          updated_at: now,
        },
        {
          key: 'faq_2',
          value: faq('How do I cancel?', 'Contact us at least 24 hours prior to your trip for free cancellation.'),
          description: 'FAQ entry 2',
          created_at: now,
          updated_at: now,
        },
        {
          key: 'faq_3',
          value: faq('Are prices fixed?', 'Yes. All routes use flat-rate pricing with no surge fees.'),
          description: 'FAQ entry 3',
          created_at: now,
          updated_at: now,
        },
      ],
      {},
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('content', null, {});
  },
};
