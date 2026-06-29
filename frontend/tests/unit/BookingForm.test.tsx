import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '../../src/components/BookingForm';
import type { BookingPayload } from '../../src/components/BookingForm';

const locations = [
  { id: 1, name: 'City Center', type: 'city' as const },
  { id: 2, name: 'International Airport', type: 'airport' as const },
];

describe('BookingForm (unit)', () => {
  let onSubmit: ReturnType<typeof vi.fn>;
  let onFetchPrice: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
    onFetchPrice = vi.fn().mockResolvedValue(45);
  });

  it('renders location and vehicle class options', () => {
    render(
      <BookingForm
        locations={locations}
        onSubmit={onSubmit}
        onFetchPrice={onFetchPrice}
      />,
    );
    expect(screen.getAllByText('City Center').length).toBeGreaterThan(0);
    expect(screen.getAllByText('International Airport').length).toBeGreaterThan(0);
    expect(screen.getByRole('option', { name: /standard/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /executive/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /van/i })).toBeInTheDocument();
  });

  it('blocks submission and shows validation errors when fields are empty', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        locations={locations}
        onSubmit={onSubmit}
        onFetchPrice={onFetchPrice}
      />,
    );

    await user.click(screen.getByRole('button', { name: /book now|submit|confirm/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it('submits a valid payload and shows the booking reference', async () => {
    const user = userEvent.setup();
    onSubmit.mockResolvedValue({ reference_id: 'BK-ABC123' });
    render(
      <BookingForm
        locations={locations}
        onSubmit={onSubmit}
        onFetchPrice={onFetchPrice}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText(/pickup/i),
      '1',
    );
    await user.selectOptions(
      screen.getByLabelText(/destination/i),
      '2',
    );

    const future = new Date(Date.now() + 1000 * 60 * 60 * 48)
      .toISOString()
      .slice(0, 16);
    await user.type(screen.getByLabelText(/date/i), future);
    await user.selectOptions(screen.getByLabelText(/vehicle/i), 'standard');
    await user.type(screen.getByLabelText(/name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');

    await user.click(screen.getByRole('button', { name: /book now|submit|confirm/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmit.mock.calls[0][0] as BookingPayload;
    expect(payload).toMatchObject({
      pickup_location_id: 1,
      destination_location_id: 2,
      vehicle_class: 'standard',
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: '+1234567890',
    });

    await waitFor(() => {
      expect(screen.getByText('BK-ABC123')).toBeInTheDocument();
    });
  });

  it('prevents selecting the same pickup and destination', async () => {
    const user = userEvent.setup();
    render(
      <BookingForm
        locations={locations}
        onSubmit={onSubmit}
        onFetchPrice={onFetchPrice}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/pickup/i), '1');
    await user.selectOptions(screen.getByLabelText(/destination/i), '1');
    const future = new Date(Date.now() + 1000 * 60 * 60 * 48)
      .toISOString()
      .slice(0, 16);
    await user.type(screen.getByLabelText(/date/i), future);
    await user.selectOptions(screen.getByLabelText(/vehicle/i), 'standard');
    await user.type(screen.getByLabelText(/name/i), 'Jane');
    await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/phone/i), '+1234567890');

    await user.click(screen.getByRole('button', { name: /book now|submit|confirm/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(
        screen.getByText(/pickup and destination must be different/i),
      ).toBeInTheDocument();
    });
  });
});
