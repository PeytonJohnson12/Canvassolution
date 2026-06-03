import { getCurrentUser } from "@/lib/auth";
import { AccountForm } from "@/components/AccountForm";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  return (
    <AccountForm
      initial={{
        fullName: user!.fullName,
        email: user!.email,
        phone: user!.phone ?? "",
      }}
    />
  );
}
