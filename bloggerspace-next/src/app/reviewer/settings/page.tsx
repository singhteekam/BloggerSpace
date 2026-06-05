import { redirect } from "next/navigation";

// Reviewers are regular users — account settings live on the standard user page.
export default function ReviewerSettingsRedirect() {
  redirect("/bloggerspace/settings");
}
