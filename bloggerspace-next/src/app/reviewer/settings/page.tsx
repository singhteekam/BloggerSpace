import { redirect } from "next/navigation";

/** Settings for reviewers lives on the profile page. */
export default function ReviewerSettingsPage() {
  redirect("/reviewer/profile");
}
