import {
  SUPPORT_TICKET_CATEGORIES,
  SUPPORT_TICKET_CATEGORY_LABELS,
  type SupportTicketCategory,
} from "@nexa/shared";
import { EnumSelect, type EnumSelectProps } from "@/components/enum-select";

type SupportTicketCategorySelectProps = Omit<
  EnumSelectProps<SupportTicketCategory>,
  "options" | "labels"
>;

export function SupportTicketCategorySelect(
  props: SupportTicketCategorySelectProps,
) {
  return (
    <EnumSelect
      {...props}
      options={SUPPORT_TICKET_CATEGORIES}
      labels={SUPPORT_TICKET_CATEGORY_LABELS}
    />
  );
}
