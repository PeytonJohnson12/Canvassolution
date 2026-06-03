import { getCurrentUser } from "@/lib/auth";
import { SettingsForm } from "@/components/SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  return (
    <SettingsForm
      initial={{
        defaultHoursPerDay: user!.defaultHoursPerDay,
        planningWindowDays: user!.planningWindowDays,
        defaultEffortHours: user!.defaultEffortHours,
      }}
    />
  );
}
