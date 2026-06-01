"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Loader2, Save, Settings as SettingsIcon, Gem, Award, BookOpen, Coins, Gift, ShieldCheck } from "lucide-react";
import { useRequireAdmin } from "@/hooks/use-require-admin";
import { adminConfigApi, type AdminConfigDoc, type AdminConfigUpdatePayload } from "@/lib/api/admin";
import { REDEMPTION_METHOD_LABELS, type RedemptionMethod } from "@/lib/api/user";
import { NotificationSettings } from "@/components/admin/notification-settings";

const ALL_REDEMPTION_METHODS: RedemptionMethod[] = ["AMAZON_GIFT_CARD", "FLIPKART_GIFT_CARD"];
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

type FormState = AdminConfigUpdatePayload;

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading } = useRequireAdmin();
  if (authLoading) return <PageSkeleton />;
  if (!user) return null;
  return <SettingsForm adminId={user._id} />;
}

function SettingsForm({ adminId }: { adminId: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>({});

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-config", adminId],
    queryFn: () => adminConfigApi.get(adminId).then((r) => r.data),
  });

  // Initialise form once when the config arrives.
  useEffect(() => {
    if (config && Object.keys(form).length === 0) {
      setForm(toForm(config));
    }
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (payload: AdminConfigUpdatePayload) =>
      adminConfigApi.update(adminId, payload).then((r) => r.data),
    onSuccess: (next) => {
      qc.setQueryData(["admin-config", adminId], next);
      setForm(toForm(next));
      toast.success("Settings saved.");
    },
    onError: (err) => {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to save settings.")
          : "Failed to save settings.",
      );
    },
  });

  if (isLoading || !config) return <PageSkeleton />;

  const dirty = JSON.stringify(toForm(config)) !== JSON.stringify(form);

  // Derived display values
  const gemValueRupees = ((form.gemValuePaise ?? config.gemValuePaise) / 100).toFixed(2);
  const minRedeemValue = (((form.minRedeemGems ?? config.minRedeemGems) * (form.gemValuePaise ?? config.gemValuePaise)) / 100).toFixed(2);
  const maxRedeemValue = (((form.maxRedeemGems ?? config.maxRedeemGems) * (form.gemValuePaise ?? config.gemValuePaise)) / 100).toFixed(2);

  const setNum = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value === "" ? "" : Number(e.target.value);
    setForm((f) => ({ ...f, [key]: val as number }));
  };

  const handleSave = () => {
    // Only send changed fields
    const changed: AdminConfigUpdatePayload = {};
    const base = toForm(config);
    for (const k of Object.keys(form) as (keyof FormState)[]) {
      if (form[k] !== base[k]) (changed as Record<string, unknown>)[k] = form[k];
    }
    if (Object.keys(changed).length === 0) {
      toast.info("Nothing to save.");
      return;
    }
    mutation.mutate(changed);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SettingsIcon className="size-5" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Platform settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure gems, redemption, grants, and scoring across the platform.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Redemption */}
        <Section icon={<Coins className="size-4" />} title="Gems & Redemption">
          <Field label="Gem value (paise)" hint={`Currently ₹${gemValueRupees} per gem`}>
            <Input type="number" min={1} value={form.gemValuePaise ?? ""} onChange={setNum("gemValuePaise")} />
          </Field>
          <Field label="Minimum redeem (gems)" hint={`= ₹${minRedeemValue}`}>
            <Input type="number" min={1} value={form.minRedeemGems ?? ""} onChange={setNum("minRedeemGems")} />
          </Field>
          <Field label="Maximum redeem (gems)" hint={`= ₹${maxRedeemValue} per request`}>
            <Input type="number" min={1} value={form.maxRedeemGems ?? ""} onChange={setNum("maxRedeemGems")} />
          </Field>
          <Field label="Cooldown between fulfilled requests (days)">
            <Input type="number" min={0} value={form.redemptionCooldownDays ?? ""} onChange={setNum("redemptionCooldownDays")} />
          </Field>
          <Field label="Flag accounts younger than (days)" hint="Admin review required for these users">
            <Input type="number" min={0} value={form.newAccountFlagDays ?? ""} onChange={setNum("newAccountFlagDays")} />
          </Field>
          <div className="min-w-0 space-y-1.5 sm:col-span-2">
            <Label className="text-xs font-medium text-muted-foreground">Enabled gift cards</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ALL_REDEMPTION_METHODS.map((m) => {
                const enabled = (form.redemptionMethods ?? config.redemptionMethods ?? []).includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      const current = form.redemptionMethods ?? config.redemptionMethods ?? [];
                      const next = enabled
                        ? current.filter((x) => x !== m)
                        : [...current, m];
                      // Don't allow disabling all — keep at least one
                      if (next.length === 0) {
                        toast.warning("At least one gift card must remain enabled.");
                        return;
                      }
                      setForm((f) => ({ ...f, redemptionMethods: next }));
                    }}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs transition-colors ${
                      enabled
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                        : "border-border bg-card hover:bg-muted/40"
                    }`}
                  >
                    <Gift className={`size-3.5 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="font-medium text-foreground">{REDEMPTION_METHOD_LABELS[m]}</span>
                    <span className={`ml-auto text-[10px] font-semibold ${enabled ? "text-primary" : "text-muted-foreground"}`}>
                      {enabled ? "Enabled" : "Disabled"}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground">Users will only see enabled gift cards in their redemption dialog.</p>
          </div>
        </Section>

        {/* Admin grants */}
        <Section icon={<Award className="size-4" />} title="Admin gem grants">
          <Field label="Minimum gems per grant">
            <Input type="number" min={1} value={form.minGrantGems ?? ""} onChange={setNum("minGrantGems")} />
          </Field>
          <Field label="Maximum gems per grant" hint="Protects against typos">
            <Input type="number" min={1} value={form.maxGrantGems ?? ""} onChange={setNum("maxGrantGems")} />
          </Field>
          <Field label="Reverse window (hours)" hint="Time during which a grant can be reversed">
            <Input type="number" min={0} value={form.grantReverseWindowHours ?? ""} onChange={setNum("grantReverseWindowHours")} />
          </Field>
        </Section>

        {/* Per-blog caps */}
        <Section icon={<Gem className="size-4" />} title="Per-blog gem caps">
          <Field label="Author cap (sum per blog)">
            <Input type="number" min={0} value={form.perBlogAuthorGemsCap ?? ""} onChange={setNum("perBlogAuthorGemsCap")} />
          </Field>
          <Field label="Reviewer cap (sum per blog)">
            <Input type="number" min={0} value={form.perBlogReviewerGemsCap ?? ""} onChange={setNum("perBlogReviewerGemsCap")} />
          </Field>
        </Section>

        {/* Scoring */}
        <Section icon={<BookOpen className="size-4" />} title="Scoring">
          <Field label="Max blog score" hint="Upper bound when admin assigns a blog score">
            <Input type="number" min={1} value={form.maxBlogScore ?? ""} onChange={setNum("maxBlogScore")} />
          </Field>
        </Section>

        {/* Security / re-verification */}
        <Section icon={<ShieldCheck className="size-4" />} title="Security & Re-verification">
          <Field
            label="Re-verification period (days)"
            hint="Email/password users must re-verify via OTP after this many days. Google/GitHub users auto-refresh on login."
          >
            <Input type="number" min={1} value={form.reverificationPeriodDays ?? ""} onChange={setNum("reverificationPeriodDays")} />
          </Field>
        </Section>

        {/* Push notifications — self-contained (own API + save) */}
        <NotificationSettings adminId={adminId} />

        <Separator />

        {/* Save bar */}
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            {dirty ? "Unsaved changes" : "Up to date"}
            {config.updatedAt && <> &middot; last updated {new Date(config.updatedAt).toLocaleString()}</>}
          </p>
          <div className="flex shrink-0 gap-2">
            <Button variant="outline" onClick={() => setForm(toForm(config))} disabled={!dirty || mutation.isPending}>
              Discard
            </Button>
            <Button onClick={handleSave} disabled={!dirty || mutation.isPending} className="gap-1.5">
              {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// Extract editable fields from the full config doc for form state
function toForm(c: AdminConfigDoc): FormState {
  return {
    gemValuePaise: c.gemValuePaise,
    minRedeemGems: c.minRedeemGems,
    maxRedeemGems: c.maxRedeemGems,
    redemptionCooldownDays: c.redemptionCooldownDays,
    newAccountFlagDays: c.newAccountFlagDays,
    redemptionMethods: c.redemptionMethods,
    minGrantGems: c.minGrantGems,
    maxGrantGems: c.maxGrantGems,
    grantReverseWindowHours: c.grantReverseWindowHours,
    perBlogAuthorGemsCap: c.perBlogAuthorGemsCap,
    perBlogReviewerGemsCap: c.perBlogReviewerGemsCap,
    maxBlogScore: c.maxBlogScore,
    reverificationPeriodDays: c.reverificationPeriodDays,
  };
}

function PageSkeleton() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 space-y-6">
      <Skeleton className="h-10 w-72" />
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
    </main>
  );
}
