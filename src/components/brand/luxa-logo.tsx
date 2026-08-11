import Image from 'next/image';

import { cn } from '@/lib/utils';

type LuxaLogoProps = {
  alt?: string;
  className?: string;
  size?: number;
};

export function LuxaLogo({ alt = '', className, size = 36 }: LuxaLogoProps) {
  return (
    <Image
      src="/luxa-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={cn('shrink-0 rounded-md bg-black object-cover', className)}
    />
  );
}
