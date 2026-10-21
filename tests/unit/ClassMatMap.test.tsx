import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClassMatMap } from '@/components/admin/ClassMatMap';
const person = { booking_id: 'b', user_id: 'u', display_name: 'Atleta de prueba', status: 'confirmed', mat_number: 2 };
function show(attendees = [person], options = {}) { return render(<MemoryRouter><ClassMatMap capacity={3} attendees={attendees} loading={false} error={false} onRetry={() => {}} {...options} /></MemoryRouter>); }
test('shows the reserved mat with member link and free mats', () => { show(); expect(screen.getByRole('link', { name: person.display_name })).toHaveAttribute('href', '/admin/members/u'); expect(screen.getAllByText('Libre')).toHaveLength(2); expect(screen.getByText('Mat 2')).toBeInTheDocument(); });
test('cancelled and waitlist reservations do not occupy mats', () => { show([{ ...person, status: 'cancelled' }, { ...person, booking_id: 'c', status: 'waitlist' }]); expect(screen.getAllByText('Libre')).toHaveLength(3); });
test('check-in and no-show retain their assigned mats', () => { show([{ ...person, status: 'checked_in' }, { ...person, booking_id: 'c', mat_number: 3, status: 'no_show' }]); expect(screen.getAllByText('Libre')).toHaveLength(1); expect(screen.getByText('Inasistencia')).toBeInTheDocument(); });
test('failed request never shows places as free', () => { show([], { error: true }); expect(screen.getByRole('alert')).toBeInTheDocument(); expect(screen.queryByText('Libre')).not.toBeInTheDocument(); });
