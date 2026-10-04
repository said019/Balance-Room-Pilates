import React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TrainingSection } from '@/components/altitud/TrainingSection';

jest.mock('@/components/altitud/SiteShell', () => ({ Arrow: () => null }));
afterEach(cleanup);

const published = [
  { id: 'e01241c1-f0a2-42d5-b62a-63afd232eada', width: 1536, height: 1024 },
  { id: '04e2fae7-9d55-40ad-9cf3-75c3d758a66e', width: 1280, height: 1100 },
  { id: '6fe991b2-a20e-4eb8-a899-30269a7b8e05', width: 1312, height: 1199 },
];
const mount = () => render(<MemoryRouter><TrainingSection /></MemoryRouter>);

it('offers only the two generated WebP widths and preserves original image attributes', () => {
  const { container } = mount();
  const pictures = container.querySelectorAll('.alt-program-photo picture');
  expect(pictures).toHaveLength(3);
  pictures.forEach((picture, index) => {
    const photo = published[index], original = `https://api.2707altitud.com.mx/api/media/public/${photo.id}`;
    const source = picture.querySelector('source')!, image = picture.querySelector('img')!;
    expect(source).toHaveAttribute('type', 'image/webp');
    expect(source).toHaveAttribute('srcset', `${original}/variants/640.webp 640w, ${original}/variants/1280.webp 1280w`);
    expect(source).toHaveAttribute('sizes', '(max-width: 767px) 88vw, 44vw');
    expect(image).toHaveAttribute('src', original);
    expect(image).toHaveAttribute('width', String(photo.width));
    expect(image).toHaveAttribute('height', String(photo.height));
    expect(image).toHaveAttribute('loading', 'lazy');
    expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
    expect(image.alt).toMatch(/^ALT\./);
  });
});

it('falls back to the original when a variant fails without affecting another photo', () => {
  const { container } = mount();
  const pictures = container.querySelectorAll('.alt-program-photo picture');
  const image = pictures[0].querySelector('img')!, original = image.getAttribute('src');
  fireEvent.error(image);
  expect(pictures[0].querySelector('source')).toBeNull();
  expect(image).toHaveAttribute('src', original);
  expect(pictures[1].querySelector('source')).not.toBeNull();
  expect(pictures[2].querySelector('source')).not.toBeNull();
  fireEvent.error(image);
  expect(pictures[0].querySelector('source')).toBeNull();
  expect(image).toHaveAttribute('src', original);
});
