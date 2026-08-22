export type AppUpdateStatus =
  | "disabled"
  | "idle"
  | "checking"
  | "current"
  | "available"
  | "downloading"
  | "restarting"
  | "error";

export interface AppUpdateContextValue {
  status: AppUpdateStatus;
  isMandatory: boolean;
  progress?: number;
  error?: string;
  checkForUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  retryMandatoryUpdate: () => Promise<void>;
}
