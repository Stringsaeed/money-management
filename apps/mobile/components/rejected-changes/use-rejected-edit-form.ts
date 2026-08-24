import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";

import {
  buildEditableFields,
  fieldsToPayload,
  type EditableField,
} from "@/components/rejected-changes/payload-fields";
import { useDatabase } from "@/db/client";
import { useRejectedChanges } from "@/hooks/use-rejected-changes";
import type { RejectedChange } from "@/lib/sync/outbox";
import { getRejectedChange } from "@/lib/sync/outbox";

/**
 * Drives the re-edit flow (#94): loads the rejected change by id, derives the
 * pre-populated form fields from its original payload, and on save resubmits
 * it under a NEW commandId before navigating back.
 */
export function useRejectedEditForm(commandId: string | null) {
  const db = useDatabase();
  const { resubmit } = useRejectedChanges();

  const [change, setChange] = useState<RejectedChange | null>(null);
  const [fields, setFields] = useState<readonly EditableField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!commandId) {
      setNotFound(true);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    void getRejectedChange(db, commandId)
      .then((loaded) => {
        if (cancelled) {
          return;
        }
        if (!loaded) {
          setNotFound(true);
        } else {
          setChange(loaded);
          setFields(buildEditableFields(loaded.payload));
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setSaveError("Could not load this rejected change. Go back and try again.");
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [commandId, db]);

  const setFieldValue = useCallback((key: string, value: string) => {
    setFields((current) =>
      current.map((field) => (field.key === key ? { ...field, value } : field)),
    );
  }, []);

  const save = useCallback(async (): Promise<boolean> => {
    if (!change) {
      return false;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await resubmit(change.commandId, fieldsToPayload(fields, change.payload));
      router.back();
      return true;
    } catch {
      // Keep the user on the form — nothing was removed from the inbox.
      setSaveError("Resubmitting failed. The change is still in your inbox — try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [change, fields, resubmit]);

  return {
    change,
    fields,
    isLoading,
    notFound,
    isSaving,
    saveError,
    setFieldValue,
    save,
  };
}
