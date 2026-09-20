import { PhysicalSaleForm } from './PhysicalSaleForm';

interface AssignMembershipFormProps {
  userId: string;
  userName: string;
  userEmail?: string;
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
}

/** Manual assignment shares the verified sale form and records its receipt. */
export function AssignMembershipForm(props: AssignMembershipFormProps) {
  return <PhysicalSaleForm {...props} />;
}
