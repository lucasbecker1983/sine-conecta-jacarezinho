import { AppAlert } from "../../components/ui";

export function PortalAlert({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  if (!message && !error) return null;
  return <AppAlert tone={error ? "error" : "success"}>{error || message}</AppAlert>;
}
