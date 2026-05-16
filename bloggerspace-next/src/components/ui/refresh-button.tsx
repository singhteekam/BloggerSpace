"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RefreshButton({
  onRefresh,
  label = "Refresh",
  className = "",
}: {
  onRefresh: () => void | Promise<void>;
  label?: string;
  className?: string;
}) {
  const [spinning, setSpinning] = useState(false);

  const handle = async () => {
    setSpinning(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setSpinning(false), 700);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handle}
      className={`gap-1.5 ${className}`}
      title="Refresh data"
    >
      <RefreshCw className={`size-3.5 ${spinning ? "animate-spin" : ""}`} />
      {label}
    </Button>
  );
}
