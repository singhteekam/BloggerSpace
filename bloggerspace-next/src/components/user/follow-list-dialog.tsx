"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, Users } from "lucide-react";
import { userApi } from "@/lib/api/user";
import { UserAvatar } from "@/components/user/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

// Shows the followers / following user list for a profile in a modal.
export function FollowListDialog({
  userId,
  type,
  open,
  onOpenChange,
}: {
  userId: string;
  type: "followers" | "following";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["follow-list", userId, type],
    queryFn: () => userApi.getFollowList(userId, type).then((r) => r.data.users),
    enabled: open && !!userId,
    staleTime: 60 * 1000,
  });

  const users = data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="capitalize">{type}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Users className="size-6" />
            <p className="text-sm">
              {type === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => (
              <Link
                key={u._id}
                href={`/user/${u.userName}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <UserAvatar src={u.profilePicture} name={u.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-sm font-medium">
                    {u.fullName}
                    {u.isVerified && <BadgeCheck className="size-3.5 shrink-0 text-primary" />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">@{u.userName}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
