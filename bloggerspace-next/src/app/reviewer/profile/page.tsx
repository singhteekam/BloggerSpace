import { redirect } from "next/navigation";

// Reviewers are regular users — their profile lives on the standard user profile page.
export default function ReviewerProfileRedirect() {
  redirect("/bloggerspace/profile");
}
