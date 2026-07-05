import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
} from "@nexa/shared";
import { EnumSelect, type EnumSelectProps } from "@/components/enum-select";

type CategorySelectProps = Omit<
  EnumSelectProps<Category>,
  "options" | "labels"
>;

export function CategorySelect(props: CategorySelectProps) {
  return (
    <EnumSelect
      {...props}
      options={CATEGORIES}
      labels={CATEGORY_LABELS}
    />
  );
}
