import { z } from 'zod';

export const BookingStep1Schema = z.object({
  pickupLocationId: z.string().uuid({ message: 'Please select a valid pickup location.' }),
  destinationLocationId: z.string().uuid({ message: 'Please select a valid destination location.' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please select a valid date.' }),
  time: z.string().regex(/^\d{2}:\d{2}$/, { message: 'Please select a valid time.' }),
}).refine(data => data.pickupLocationId !== data.destinationLocationId, {
  message: 'Pickup and destination locations must be different.',
  path: ['destinationLocationId'],
});
