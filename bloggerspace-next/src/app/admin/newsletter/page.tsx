"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Mail, Search, CheckSquare, Square, Loader2, Send, Users, History } from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminApi, type UserItem, type NewsletterRecord } from "@/lib/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TipTapEditor } from "@/components/editor/tiptap-editor";
import { formatDate } from "@/lib/utils/html";

export default function AdminNewsletterPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <NewsletterComposer adminId={user._id} />;
}

function NewsletterComposer({ adminId }: { adminId: string }) {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Mail className="size-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Newsletter</h1>
          <p className="text-sm text-muted-foreground">Compose and send an email to selected users.</p>
        </div>
      </div>
      <Tabs defaultValue="compose">
        <TabsList className="mb-6">
          <TabsTrigger value="compose"><Mail className="size-3.5 mr-1.5" />Compose</TabsTrigger>
          <TabsTrigger value="history"><History className="size-3.5 mr-1.5" />History</TabsTrigger>
        </TabsList>
        <TabsContent value="compose"><ComposeTab adminId={adminId} /></TabsContent>
        <TabsContent value="history"><HistoryTab adminId={adminId} /></TabsContent>
      </Tabs>
    </main>
  );
}

function ComposeTab({ adminId }: { adminId: string }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", adminId],
    queryFn: () => adminApi.getUsers(adminId).then((r) => r.data),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName?.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.userName?.toLowerCase().includes(q),
    );
  }, [users, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((u) => selected.has(u.email));

  const toggleUser = (email: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((u) => next.delete(u.email));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((u) => next.add(u.email));
        return next;
      });
    }
  };

  const sendMutation = useMutation({
    mutationFn: () => {
      const selectedUsers = users
        .filter((u) => selected.has(u.email))
        .map((u) => ({ value: u.email, label: u.fullName ?? u.userName ?? u.email }));
      return adminApi.sendNewsletter(adminId, { selectedUsers, subject, message });
    },
    onSuccess: () => {
      toast.success(`Newsletter sent to ${selected.size} recipient${selected.size !== 1 ? "s" : ""}.`);
      setSubject("");
      setMessage("");
      setSelected(new Set());
    },
    onError: (err) => {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to send newsletter.")
          : "Error sending newsletter.",
      );
    },
  });

  const canSend = selected.size > 0 && subject.trim() && message.trim();

  return (
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left — recipient selector */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Recipients
              {selected.size > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selected.size} selected
                </Badge>
              )}
            </Label>
            <button
              onClick={toggleAll}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              {allFilteredSelected ? (
                <CheckSquare className="size-3.5" />
              ) : (
                <Square className="size-3.5" />
              )}
              {allFilteredSelected ? "Deselect all" : "Select all"}
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* User list */}
          <div className="max-h-80 overflow-y-auto rounded-md border divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="size-4 rounded" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
                <Users className="size-5" />
                {search ? "No users match your search." : "No users found."}
              </div>
            ) : (
              filtered.map((u) => (
                <UserRow
                  key={u._id}
                  user={u}
                  checked={selected.has(u.email)}
                  onToggle={() => toggleUser(u.email)}
                />
              ))
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {users.length} total user{users.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Right — compose */}
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="Email subject…"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Message *</Label>
            <TipTapEditor
              content={message}
              onChange={setMessage}
              placeholder="Write your newsletter content here…"
              minHeight="280px"
            />
            <p className="text-xs text-muted-foreground">
              Rich text — formatted as HTML in the email.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selected.size > 0
                ? `Sending to ${selected.size} recipient${selected.size !== 1 ? "s" : ""}`
                : "Select recipients to send"}
            </p>
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={!canSend || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send newsletter
            </Button>
          </div>
        </div>
      </div>
  );
}

function HistoryTab({ adminId }: { adminId: string }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["newsletter-history", adminId, page],
    queryFn: () => adminApi.getNewsletterHistory(adminId, page).then((r) => r.data),
  });

  const newsletters = data?.newsletters ?? [];
  const totalPages = data?.pages ?? 1;

  if (isLoading) return (
    <div className="space-y-3">
      {[0,1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );

  if (newsletters.length === 0) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
      <History className="size-8" />
      <p className="text-sm">No newsletters sent yet.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{data?.total ?? 0} newsletters sent</p>
      <div className="divide-y divide-border rounded-xl border">
        {newsletters.map((n) => (
          <div key={n._id} className="px-4 py-3 space-y-1">
            <div className="flex items-start justify-between gap-4">
              <p className="font-medium text-sm">{n.subject}</p>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {n.recipientCount} recipient{n.recipientCount !== 1 ? "s" : ""}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{formatDate(n.sentAt)}</p>
            {n.recipients.length > 0 && (
              <p className="text-xs text-muted-foreground truncate">
                To: {n.recipients.slice(0, 3).map((r) => r.email).join(", ")}
                {n.recipients.length > 3 && ` +${n.recipients.length - 3} more`}
              </p>
            )}
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-xs text-muted-foreground">{page} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

function UserRow({
  user,
  checked,
  onToggle,
}: {
  user: UserItem;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
    >
      {checked ? (
        <CheckSquare className="size-4 shrink-0 text-primary" />
      ) : (
        <Square className="size-4 shrink-0 text-muted-foreground" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {user.fullName ?? user.userName ?? "—"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
    </button>
  );
}

function PageSkeleton() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12 space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    </main>
  );
}
