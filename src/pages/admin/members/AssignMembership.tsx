import {PurchaseLink} from '@/components/admin/PurchaseLink';
import {AdminLayout} from '@/components/layout/AdminLayout';
import {AuthGuard} from '@/components/layout/AuthGuard';
export default function AssignMembership(){return <AuthGuard requiredRoles={['admin']}><AdminLayout><div className="mx-auto max-w-2xl space-y-6 py-6"><h1 className="text-3xl">Preparar compra de membresía</h1><PurchaseLink/></div></AdminLayout></AuthGuard>;}
