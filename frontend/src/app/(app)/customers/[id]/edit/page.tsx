"use client";

import { useParams } from "next/navigation";
import { CustomerForm } from "@/components/CustomerForm";

export default function CustomerEditPage() {
  const params = useParams<{ id: string }>();
  return <CustomerForm mode="edit" customerId={params.id} />;
}
