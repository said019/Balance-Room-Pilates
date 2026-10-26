import {useParams} from 'react-router-dom';
import {RunningClinic} from '@/components/altitud/RunningClinic';
import {SiteHeader,SiteFooter} from '@/components/altitud/SiteShell';
export default function RunningClinicPage(){const {eventId}=useParams();return <div className="alt-site"><SiteHeader/><main><RunningClinic eventId={eventId}/></main><SiteFooter/></div>;}
