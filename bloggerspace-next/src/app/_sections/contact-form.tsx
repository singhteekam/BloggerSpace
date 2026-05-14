"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !message.trim()) {
      toast.info("Please fill in all required fields.");
      return;
    }
    setSending(true);
    try {
      await api.post("/api/users/contactus", { email, message });
      toast.success("Message sent! We'll get back to you soon.");
      setEmail("");
      setMessage("");
    } catch (err) {
      toast.error(
        isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to send message.")
          : "An error occurred. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="contact-email">Email *</Label>
        <Input
          id="contact-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message *</Label>
        <Textarea
          id="contact-message"
          placeholder="Your feedback, bug reports, or suggestions…"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          className="resize-none"
        />
      </div>
      <Button type="submit" className="w-full" disabled={sending}>
        {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
        Send message
      </Button>
    </form>
  );
}
