"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Gem, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi, type GemsTransaction, type GemsTxnSource } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/html";

const SOURCE_LABELS: Record<GemsTxnSource, string> = {
  BLOG_AWARD: "Blog award",
  ADMIN_GRANT: "Admin grant",
  ADMIN_GRANT_REVERSE: "Grant reversal",
  REDEMPTION_DEDUCT: "Redemption",
  REDEMPTION_REFUND: "Redemption refund",
};

const SOURCE_OPTIONS = Object.keys(SOURCE_LABELS) as GemsTxnSource[];

export default function AdminGemsPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <GemsTransactions adminId={user._id} />;
}

function GemsTransactions({ adminId }: { adminId: string }) {
  const [page, setPage] = useState(1);
  const [source, setSource] = useState<GemsTxnSource | "">("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-gems-transactions", adminId, page, source],
    queryFn: () =>
      adminApi.getGemsTransactions(adminId, page, undefined, source || undefined).then((r) => r.data),
    staleTime: 60 * 1000,
  });

  const transactions = data?.transactions ?? [];
  const totalPages = data?.pages ?? 1;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href="/admin/dashboard"
        className="mb-6 flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-4" />
        Dashboard
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
          <Gem className="size-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Gems Transactions</h1>
          <p className="text-sm text-muted-foreground">Full history of gem awards, grants & redemptions</p>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value as GemsTxnSource | ""); setPage(1); }}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All sources</option>
          {SOURCE_OPTIONS.map((s) => (
            <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
          ))}
        </select>
        {!isLoading && (
          <span className="text-xs text-muted-foreground">{(data?.total ?? 0).toLocaleString()} transactions</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-20 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Gem className="size-5" />
          </div>
          <p className="text-sm text-muted-foreground">No transactions found.</p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border rounded-xl border border-border">
            {transactions.map((tx) => <TransactionRow key={tx._id} tx={tx} />)}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" className="gap-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="size-3.5" />Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next<ChevronRight className="size-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

function TransactionRow({ tx }: { tx: GemsTransaction }) {
  const isAward = tx.type === "AWARD";
  const owner = typeof tx.userId === "object" && tx.userId !== null ? tx.userId : null;
  const ownerName = owner ? (owner.fullName || owner.userName || owner.email) : "Unknown user";
  const ownerHandle = owner?.userName ? `@${owner.userName}` : owner?.email;
  const grantedBy = typeof tx.awardedBy === "object" && tx.awardedBy !== null ? tx.awardedBy : null;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
        isAward
          ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      }`}>
        {isAward ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          {owner?.userName ? (
            <Link href={`/user/${owner.userName}`} className="text-sm font-medium hover:text-primary transition-colors">
              {ownerName}
            </Link>
          ) : (
            <span className="text-sm font-medium">{ownerName}</span>
          )}
          {tx.source && <Badge variant="secondary" className="text-[10px]">{SOURCE_LABELS[tx.source] ?? tx.source}</Badge>}
          {tx.role && <span className="text-[11px] text-muted-foreground">as {tx.role.toLowerCase()}</span>}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {ownerHandle && <span>{ownerHandle} · </span>}
          {tx.blogTitle ? <span>{tx.blogTitle} · </span> : null}
          {formatDate(tx.createdAt)}
          {grantedBy && <span> · by {grantedBy.fullName || grantedBy.email}</span>}
        </p>
        {tx.note && <p className="mt-0.5 truncate text-[11px] italic text-muted-foreground">“{tx.note}”</p>}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className={`text-sm font-semibold ${isAward ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {isAward ? "+" : "-"}{tx.amount}
        </span>
        <Gem className="size-3 text-primary" />
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-9 w-40" />
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    </div>
  );
}
