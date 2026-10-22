import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { format, startOfWeek } from 'date-fns';
import { PublicClassAgenda } from '@/components/schedule/PublicClassAgenda';
jest.mock('@tanstack/react-query', () => ({ useQuery: jest.fn() }));
import { useQuery } from '@tanstack/react-query';
test('shows class focus from API and booking destination', () => {
  (useQuery as jest.Mock).mockReturnValue({ data: [{id:'session',date:format(startOfWeek(new Date(),{weekStartsOn:1}),'yyyy-MM-dd'),start_time:'08:10',end_time:'09:00',class_type_name:'ALT. TRAIN',training_focus:'LOWER BODY',instructor_name:'Olivia',status:'scheduled'}] });
  render(<MemoryRouter><PublicClassAgenda /></MemoryRouter>);
  expect(screen.getByText('LOWER BODY')).toBeInTheDocument();
  expect(screen.getByRole('link',{name:/Ver clase →/})).toHaveAttribute('href','/app/book/session');
  const first = (useQuery as jest.Mock).mock.calls.at(-1)[0].queryKey;
  fireEvent.click(screen.getByRole('button',{name:'Semana siguiente'}));
  expect((useQuery as jest.Mock).mock.calls.at(-1)[0].queryKey).not.toEqual(first);
});
