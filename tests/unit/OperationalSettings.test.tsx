import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { OperationalSettingsContent } from '@/pages/admin/settings/OperationalSettings';
import api from '@/lib/api';

jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn(), put: jest.fn() }, getErrorMessage: (error: any) => error.response?.data?.error || error.message }));
jest.mock('@/components/layout/AdminLayout', () => ({ AdminLayout: ({ children }: any) => <main>{children}</main> }));
jest.mock('@/components/layout/AuthGuard', () => ({ AuthGuard: ({ children }: any) => children }));
jest.mock('@/pages/admin/settings/FoundingPolicySettings', () => ({ FoundingPolicySettings: () => null }));
// Independent settings panels have separate API contracts and browser coverage.
jest.mock('@/pages/admin/settings/OpeningClassesSettings', () => ({ OpeningClassesSettings: () => null }));
jest.mock('@/pages/admin/settings/PurchaseConsentSettings', () => ({ PurchaseConsentSettings: () => null }));
const settings = {
    version: 3, cancellation_hours: 4, booking_advance_days: null, max_active_bookings: null, max_bookings_per_day: null,
    decisions: { booking_advance_days: 'pending', max_active_bookings: 'pending', max_bookings_per_day: 'pending' },
    pendingDecisions: [{ key: 'waitlist_mode', status: 'pending', adminNote: '', source: 'not_implemented', currentBehavior: 'La promoción actual conserva su operación vigente.', requiresImplementation: true }],
    checkin: { editable: false, source: 'system_settings/defaults' },
};
const mount = () => render(<MemoryRouter><OperationalSettingsContent /></MemoryRouter>);
beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockResolvedValue({ data: settings });
    (api.put as jest.Mock).mockResolvedValue({ data: { ...settings, version: 4, cancellation_hours: 6 } });
});
afterEach(cleanup);

it('keeps unknown limits blank and identifies them as pending without invented defaults', async () => {
    mount();
    expect(await screen.findByLabelText('Anticipación máxima para reservar')).toHaveValue(null);
    expect(screen.getByLabelText('Reservas activas por persona')).toHaveValue(null);
    expect(screen.getByLabelText('Reservas por persona al día')).toHaveValue(null);
    expect(screen.getByLabelText('Anticipación para cancelar o reagendar')).toHaveValue(4);
    expect(screen.getAllByText('Pendiente de configurar').length).toBeGreaterThan(0);
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.getByRole('button', { name: 'Guardar configuración' })).toBeDisabled();
});

it('persists explicit rules and administrative notes with the loaded version, never activation flags', async () => {
    mount();
    const hours = await screen.findByLabelText('Anticipación para cancelar o reagendar');
    await userEvent.clear(hours); await userEvent.type(hours, '6');
    await userEvent.click(screen.getByText('Lista de espera', { exact: true }));
    await userEvent.type(screen.getByLabelText('Nota administrativa: Lista de espera'), 'Confirmar con el equipo el orden de promoción.');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }));
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/operational-settings', {
        expectedVersion: 3, cancellation_hours: 6, booking_advance_days: null, max_active_bookings: null, max_bookings_per_day: null,
        pendingDecisionNotes: { waitlist_mode: 'Confirmar con el equipo el orden de promoción.' },
    }));
    expect(await screen.findByText('Configuración guardada.')).toBeVisible();
});

it('preserves an unsaved draft after a version conflict and only replaces it on explicit reload', async () => {
    (api.put as jest.Mock).mockRejectedValue({ response: { status: 409, data: { error: 'La versión cambió' } } });
    mount();
    const hours = await screen.findByLabelText('Anticipación para cancelar o reagendar');
    await userEvent.clear(hours); await userEvent.type(hours, '6');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Otra persona actualizó la configuración');
    expect(hours).toHaveValue(6);
    expect(screen.getByRole('button', { name: 'Guardar configuración' })).toBeDisabled();
    (api.get as jest.Mock).mockResolvedValue({ data: { ...settings, version: 4, cancellation_hours: 8 } });
    await userEvent.click(screen.getByRole('button', { name: 'Recargar y descartar mis cambios' }));
    expect(await screen.findByLabelText('Anticipación para cancelar o reagendar')).toHaveValue(8);
});

it('does not fabricate settings or expose a save action after a failed load', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Sin conexión'));
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos consultar la configuración');
    expect(screen.getByRole('button', { name: 'Volver a consultar' })).toBeEnabled();
    expect(screen.queryByRole('button', { name: 'Guardar configuración' })).toBeNull();
});

it('rejects decimals and out-of-range limits before writing', async () => {
    mount();
    const limit = await screen.findByLabelText('Reservas activas por persona');
    await userEvent.type(limit, '101');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar configuración' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('entre 1 y 100');
    expect(api.put).not.toHaveBeenCalled();
});
