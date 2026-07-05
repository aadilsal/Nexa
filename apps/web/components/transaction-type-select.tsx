import {
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  type TransactionType,
} from "@nexa/shared";
import { EnumSelect, type EnumSelectProps } from "@/components/enum-select";

type TransactionTypeSelectProps = Omit<
  EnumSelectProps<TransactionType>,
  "options" | "labels"
>;

export function TransactionTypeSelect(props: TransactionTypeSelectProps) {
  return (
    <EnumSelect
      {...props}
      options={TRANSACTION_TYPES}
      labels={TRANSACTION_TYPE_LABELS}
    />
  );
}
