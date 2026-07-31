import { buyerFunctions } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type BuyerFunctionSelectProps = {
  id?: string;
  name?: string;
  defaultValue?: string;
  className?: string;
};

export function BuyerFunctionSelect({
  id = 'buyerFunction',
  name = 'buyerFunction',
  defaultValue,
  className,
}: BuyerFunctionSelectProps) {
  const isLegacyValue = Boolean(
    defaultValue && !buyerFunctions.some((item) => item.value === defaultValue),
  );

  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue ?? ''}
      className={cn(
        'h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        className,
      )}
    >
      <option value="">Select a buyer function</option>
      {buyerFunctions.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
      {isLegacyValue ? (
        <option value={defaultValue}>Previous classification — {defaultValue}</option>
      ) : null}
    </select>
  );
}
