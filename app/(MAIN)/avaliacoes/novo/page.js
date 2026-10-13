"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import NovaAvaliacaoModal from "../../../../components/NovaAvaliacaoModal";

export default function NovaAvaliacaoPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) return null;

  return (
    <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <NovaAvaliacaoModal
        isOpen={true}
        onClose={() => router.push("/avaliacoes")}
      />
    </div>
  );
}