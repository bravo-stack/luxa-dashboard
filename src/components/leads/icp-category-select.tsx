import { icpCategories } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

type IcpCategorySelectProps = {
  id?: string;
  name?: string;
  defaultValue?: string;
  className?: string;
};

export function IcpCategorySelect({
  id = 'icpCategory',
  name = 'icpCategory',
  defaultValue,
  className,
}: IcpCategorySelectProps) {
  const isLegacyValue = Boolean(
    defaultValue && !icpCategories.some((category) => category.value === defaultValue),
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
      <option value="">Select an ICP tier</option>
      <optgroup label="Account tiers">
        {icpCategories.slice(0, 4).map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </optgroup>
      <optgroup label="Other classifications">
        {icpCategories.slice(4).map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </optgroup>
      {isLegacyValue ? (
        <option value={defaultValue}>Legacy — {defaultValue}</option>
      ) : null}
    </select>
  );
}
