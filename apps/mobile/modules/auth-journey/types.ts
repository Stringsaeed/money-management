import type { AuthActionFailure } from "@/modules/access/actions";
import type { Identity, LinkOperation } from "@/modules/access";

export type AuthFailure = AuthActionFailure;

export type Notice =
  | { readonly kind: "link_sent"; readonly operation: LinkOperation; readonly email: string }
  | { readonly kind: "link_unusable"; readonly operation: LinkOperation }
  | { readonly kind: "problem"; readonly failure: AuthFailure };

interface StepBase {
  readonly email: string;
  readonly busy: boolean;
  readonly notice: Notice | null;
}

export interface ResetGrant {
  readonly token: string;
}

export type JourneyState =
  | ({ readonly step: "identify" } & StepBase)
  | ({
      readonly step: "await_link";
      readonly operation: "sign_in";
      readonly resendAvailableAt: string;
    } & StepBase)
  | ({ readonly step: "password" } & StepBase)
  | ({ readonly step: "create_profile"; readonly displayName: string } & StepBase)
  | ({ readonly step: "recover" } & StepBase)
  | ({
      readonly step: "recovery_sent";
      readonly resendAvailableAt: string;
    } & StepBase)
  | ({ readonly step: "choose_password"; readonly grant: ResetGrant } & StepBase)
  | { readonly step: "established"; readonly user: Identity };

export type JourneyEvent =
  | { readonly type: "email_changed"; readonly email: string }
  | { readonly type: "name_changed"; readonly displayName: string }
  | { readonly type: "chose_password" }
  | { readonly type: "chose_create_profile" }
  | { readonly type: "chose_recovery" }
  | { readonly type: "back_to_identify" }
  | { readonly type: "requested_sign_in_link" }
  | { readonly type: "requested_recovery_link" }
  | { readonly type: "requested_resend" }
  | { readonly type: "submitted_password"; readonly password: string }
  | {
      readonly type: "submitted_new_profile";
      readonly password: string;
      readonly displayName: string;
    }
  | { readonly type: "submitted_new_password"; readonly password: string }
  | { readonly type: "opened_reset_grant"; readonly grant: ResetGrant }
  | { readonly type: "link_dispatched"; readonly operation: LinkOperation; readonly at: string }
  | { readonly type: "session_established"; readonly user: Identity }
  | { readonly type: "attempt_failed"; readonly failure: AuthFailure }
  | { readonly type: "grant_rejected"; readonly operation: LinkOperation };

export interface ReduceResult {
  readonly state: JourneyState;
  readonly effect: JourneyEffect | null;
}

export type JourneyEffect =
  | { readonly kind: "send_link"; readonly email: string; readonly operation: LinkOperation }
  | { readonly kind: "sign_in_with_password"; readonly email: string; readonly password: string }
  | {
      readonly kind: "create_profile";
      readonly email: string;
      readonly password: string;
      readonly displayName: string;
    }
  | {
      readonly kind: "complete_reset";
      readonly grant: ResetGrant;
      readonly email: string;
      readonly password: string;
    };
