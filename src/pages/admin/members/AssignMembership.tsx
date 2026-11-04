import {useParams} from 'react-router-dom';
import {StudioSale} from '@/components/admin/StudioSale';
import {AdminLayout} from '@/components/layout/AdminLayout';
import {AuthGuard} from '@/components/layout/AuthGuard';
export default function AssignMembership(){const {userId}=useParams();return <AuthGuard requiredRoles={['admin']}><AdminLayout><div className="mx-auto max-w-2xl space-y-6 py-6"><h1 className="text-3xl">Asignar plan en el estudio</h1><StudioSale userId={userId}/></div></AdminLayout></AuthGuard>;}
