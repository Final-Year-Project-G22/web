"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function TaxonomyPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/taxonomy/sectors");
  }, [router]);
  return null;
}
