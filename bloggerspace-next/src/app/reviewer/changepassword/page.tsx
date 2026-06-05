import { redirect } from "next/navigation";

// Reviewers are regular users — password changes use the standard user security page.
export default function ReviewerChangePasswordRedirect() {
  redirect("/bloggerspace/security");
}
