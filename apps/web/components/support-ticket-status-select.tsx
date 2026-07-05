import {
  SUPPORT_TICKET_STATUSES,
  SUPPORT_TICKET_STATUS_LABELS,
  type SupportTicketStatus,
} from "@nexa/shared";
import { EnumSelect, type EnumSelectProps } from "@/components/enum-select";

type SupportTicketStatusSelectProps = Omit<
  EnumSelectProps<SupportTicketStatus>,
  "options" | "labels"
>;

export function SupportTicketStatusSelect(
  props: SupportTicketStatusSelectProps,
) {
  return (
    <EnumSelect
      {...props}
      options={SUPPORT_TICKET_STATUSES}
      labels={SUPPORT_TICKET_STATUS_LABELS}
      compact
      className={props.className ?? "w-auto min-w-[10rem]"}
    />
  );
}
