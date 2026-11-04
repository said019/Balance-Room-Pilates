import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import {StudioSale} from '@/components/admin/StudioSale';
import {postFinancialOperation} from '@/lib/financial-intent';
jest.mock('@/hooks/use-active-plans',()=>({useActivePlans:()=>({data:[{id:'plan-test',name:'ASCENSO',price:1099}]})}));
jest.mock('@tanstack/react-query',()=>({useQuery:()=>({data:[]}),useQueryClient:()=>({invalidateQueries:()=>Promise.resolve()})}));
jest.mock('@/lib/api',()=>({__esModule:true,default:{get:jest.fn()},getErrorMessage:()=> 'Error'}));
jest.mock('@/lib/financial-intent',()=>({postFinancialOperation:jest.fn().mockResolvedValue({})}));
test('staff activates after confirming payment and in-person declaration, without a link',async()=>{
 render(<StudioSale userId="member-test"/>);
 const button=screen.getByRole('button',{name:'Registrar pago y activar plan'});
 expect(button).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Paquete'),{target:{value:'plan-test'}});
 for(const box of screen.getAllByRole('checkbox'))fireEvent.click(box);
 expect(button).toBeEnabled();fireEvent.click(button);
 await waitFor(()=>expect(postFinancialOperation).toHaveBeenCalledWith('/memberships/assign',expect.objectContaining({userId:'member-test',planId:'plan-test',paymentMethod:'cash',inPersonDeclaration:true,status:'active'})));
 expect(await screen.findByText('Plan asignado y pago registrado')).toBeVisible();
 expect(screen.queryByText('Copiar enlace')).toBeNull();
});
