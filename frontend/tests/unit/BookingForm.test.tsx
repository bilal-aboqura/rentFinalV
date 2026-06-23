import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '../../src/components/BookingForm';
import type { LocationDTO } from '../../src/types';

const locations: LocationDTO[] = [
  { id: 1, name: 'City Center', type: 'city', status: 'active' },
  { id: 2, name: 'International Airport', type: 'airport', status: 'active' },
];

const defaultQuote = vi.fn();
const defaultSubmit = vi.fn();

function renderForm(overrides: { onQuote?: typeof defaultQuote; onSubmit?: typeof defaultSubmit } = {}) {
  const onQuote = overrides.onQuote ?? vi.fn().mockResolvedValue(45);
  const onSubmit =
    overrides.onSubmit ??
    vi.fn().mockResolvedValue({ reference_id: 'BK-ABC123', total_price: 45, status: 'pending' });
  render(<BookingForm locations={locations} onQuote={onQuote} onSubmit={onSubmit} />);
  return { onQuote, onSubmit };
}

async function fillValidForm() {
  const user = userEvent.setup();
  await user.selectOptions(screen.getByLabelText(/pickup location/i), '1');
  await user.selectOptions(screen.getByLabelText(/destination/i), '2');
  await user.selectOptions(screen.getByLabelText(/vehicle class/i), 'standard');
  await user.type(screen.getByLabelText(/trip date/i), '2030-07-01T14:30');
  await user.type(screen.getByLabelText(/full name/i), 'John Doe');
  await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
  await user.type(screen.getByLabelText(/phone/i), '+1234567890');
  return user;
}

describe('BookingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required inputs and the submit button', () => {
    renderForm();
    expect(screen.getByLabelText(/pickup location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/vehicle class/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trip date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /book transfer|submit|book/i })).toBeEnabled();
  });

  it('shows validation errors and does not submit when fields are empty', async () => {
    const { onSubmit } = renderForm();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /book transfer|submit|book/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('fetches a price estimate once a route and vehicle are selected', async () => {
    const { onQuote } = renderForm();
    const user = userEvent.setup();
    await user.selectOptions(screen.getByLabelText(/pickup location/i), '1');
    await user.selectOptions(screen.getByLabelText(/destination/i), '2');
    await user.selectOptions(screen.getByLabelText(/vehicle class/i), 'standard');

    await waitFor(() => {
      expect(onQuote).toHaveBeenCalledWith({ pickupLocationId: 1, destinationLocationId: 2, vehicleClass: 'standard' });
    });
    expect(await screen.findByText(/\$45/)).toBeInTheDocument();
  });

  it('submits the booking payload and shows a confirmation with the reference id', async () => {
    const { onSubmit } = renderForm();
    const user = await fillValidForm();
    await user.click(screen.getByRole('button', { name: /book transfer|submit|book/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        pickup_location_id: 1,
        destination_location_id: 2,
        vehicle_class: 'standard',
        customer_name: 'John Doe',
        customer_email: 'john.doe@example.com',
        customer_phone: '+1234567890',
      }),
    );

    const confirmation = await screen.findByTestId('booking-confirmation');
    expect(within(confirmation).getByText(/BK-ABC123/i)).toBeInTheDocument();
  });
});
