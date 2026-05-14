"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { DatabaseZap, Loader2 } from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminMaintenancePage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <MaintenancePanel adminId={user._id} />;
}

function MaintenancePanel({ adminId }: { adminId: string }) {
  const [migrateResult, setMigrateResult] = useState<string | null>(null);

  const migrateMutation = useMutation({
    mutationFn: () => adminApi.migrateReviewers(adminId),
    onSuccess: (res) => {
      const { total, migrated, merged, skipped } = res.data;
      setMigrateResult(
        `Done — ${total} total: ${migrated} created, ${merged} merged into existing users, ${skipped} already migrated.`,
      );
      toast.success("Migration complete.");
    },
    onError: (err) =>
      toast.error(isAxiosError(err) ? (err.response?.data?.error ?? "Migration failed.") : "Error."),
  });

  return (
    <main className="px-6 py-8 max-w-3xl mx-auto">
      <h1 className="font-serif text-2xl font-semibold mb-8">Maintenance</h1>

      <div className="space-y-4">
        {/* Reviewer migration */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="font-medium text-foreground flex items-center gap-2">
              <DatabaseZap className="size-4 text-primary" />
              Migrate Reviewers → User Collection
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Transfers all existing documents from the{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">reviewers</code> collection into the{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">users</code> collection with{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">role: &quot;reviewer&quot;</code>.
              Existing users with the same email get the reviewer role merged in. Safe to run multiple times.
            </p>
          </div>
          {migrateResult && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              {migrateResult}
            </div>
          )}
          <Button
            onClick={() => migrateMutation.mutate()}
            disabled={migrateMutation.isPending}
            className="gap-2"
          >
            {migrateMutation.isPending
              ? <Loader2 className="size-4 animate-spin" />
              : <DatabaseZap className="size-4" />}
            Run Migration
          </Button>
        </div>
      </div>
    </main>
  );
}

function PageSkeleton() {
  return (
    <div className="px-6 py-8 max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
