"use client";

import { useParams } from "next/navigation";
import { BillingForm } from "@/components/BillingForm";

export default function BillingEditPage() {
  const params = useParams<{ id: string }>();
  return <BillingForm mode="edit" billingId={params.id} />;
}
