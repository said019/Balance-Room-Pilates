import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Index from '@/pages/Index';

jest.mock('@tanstack/react-query', () => ({ useIsFetching: () => 0, useQuery: () => ({ data: [], isLoading: false, isError: false }) }));
jest.mock('@/pages/AltitudMemberships', () => ({ MembershipsSection: () => null }));
jest.mock('@/hooks/use-cancellation-policy', () => ({ CancellationTerms: () => null }));
jest.mock('@/components/altitud/TrainingSection', () => ({ TrainingSection: () => null }));
jest.mock('@/components/altitud/SiteShell', () => ({ SiteHeader: () => null, SiteFooter: () => null, Arrow: () => null }));
jest.mock('@/components/altitud/StudioDetails', () => ({ StudioHours: () => null, StudioContact: () => null }));
jest.mock('@/lib/api', () => ({ __esModule: true, default: { get: jest.fn() } }));
afterEach(cleanup);

const expected = [
  { id: 'c8cefb64-5004-4fc8-a926-7ae769b379ce', width: 1200, height: 799,
    alt: 'Atletas de Altitud cruzando la meta en una competencia híbrida' },
  { id: '12288703-5b04-4b51-b159-d441e7cb0833', width: 853, height: 880,
    alt: 'Invitación de 2707 Altitud a las clases gratis de apertura' },
  { id: 'ccef5db1-2c45-4096-9048-e85b5c734c60', width: 853, height: 1014,
    alt: 'Invitación a la inauguración Training Experience de 2707 Altitud' },
];
const mount = () => render(<MemoryRouter><Index /></MemoryRouter>);
const selector = '.alt-hero-visual picture, #apertura article picture';

it('uses native public widths and preserves dimensions, text and loading priority in the actual landing page', () => {
  const { container } = mount();
  const pictures = container.querySelectorAll(selector);
  expect(pictures).toHaveLength(3);
  pictures.forEach((picture, i) => {
    const photo = expected[i], original = `https://api.2707altitud.com.mx/api/media/public/${photo.id}`;
    const source = picture.querySelector('source')!, image = picture.querySelector('img')!;
    expect(source).toHaveAttribute('type', 'image/webp');
    expect(source).toHaveAttribute('srcset', `${original}/variants/640.webp 640w, ${original}/variants/${photo.width}.webp ${photo.width}w`);
    expect(source.getAttribute('srcset')).not.toContain('1280');
    expect(source.getAttribute('sizes')).toContain('(max-width: 767px)');
    expect(image).toHaveAttribute('src', original);
    expect(image).toHaveAttribute('alt', photo.alt);
    expect(image).toHaveAttribute('width', String(photo.width));
    expect(image).toHaveAttribute('height', String(photo.height));
    expect(image).not.toHaveAttribute('fetchpriority');
    if (i === 0) {
      expect(image).not.toHaveAttribute('loading');
      expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
    } else {
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveClass('w-full', 'rounded-xl');
      expect(image).not.toHaveAttribute('referrerpolicy');
    }
  });
});

it.each([0, 1, 2])('image %s falls back once to its public original without affecting the other images', index => {
  const { container } = mount();
  const pictures = container.querySelectorAll(selector), image = pictures[index].querySelector('img')!;
  const original = image.getAttribute('src');
  fireEvent.error(image);
  expect(pictures[index].querySelector('source')).toBeNull();
  expect(image).toHaveAttribute('src', original);
  pictures.forEach((picture, i) => { if (i !== index) expect(picture.querySelector('source')).not.toBeNull(); });
  fireEvent.error(image);
  expect(pictures[index].querySelector('source')).toBeNull();
  expect(image).toHaveAttribute('src', original);
});
