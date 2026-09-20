import { forwardRef, type ImgHTMLAttributes } from 'react';
import { useMediaSource } from '@/lib/useMediaSource';
export const PrivateMediaImage=forwardRef<HTMLImageElement,ImgHTMLAttributes<HTMLImageElement>>(function PrivateMediaImage({src,...props},ref){
 const resolved=useMediaSource(src);
 return <img {...props} ref={ref} src={resolved}/>;
});
