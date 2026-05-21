import { AppBadge } from "../ui";
import { friendlyStatus, statusTone } from "../../utils/statusLabels";

export function CompanyStatusBadge({ status }: { status?: string | null }) {
  return <AppBadge tone={statusTone(status)}>{friendlyStatus(status)}</AppBadge>;
}
