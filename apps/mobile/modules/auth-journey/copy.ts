import type { AuthFailure, Notice } from "./types";

export function noticeCopy(notice: Notice): string {
  if (notice.kind === "link_sent") {
    return "Check your email for a link. Same note for any address. 📬";
  }
  if (notice.kind === "link_unusable") {
    return "This link is expired or already used. Request a new one.";
  }
  return failureCopy(notice.failure);
}

export function failureCopy(failure: AuthFailure): string {
  if (failure.kind === "offline") {
    return "Could not reach the server. Check your connection and try again.";
  }
  if (failure.kind === "bad_credentials") {
    return "That email and password didn't match.";
  }
  if (failure.kind === "weak_password") return failure.requirement;
  if (failure.kind === "rate_limited") {
    return "Too many attempts. Wait a moment and try again.";
  }
  return "Something went wrong. Please try again.";
}
