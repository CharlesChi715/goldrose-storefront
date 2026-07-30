"use client";

/**
 * ROLE OF THIS FILE
 * Shared attachments control for forum forms (owner request 2026-07-22):
 * an "Attach files" button + paste-to-attach. React state owns the File
 * list; a real hidden <input type="file" name="files"> is kept in sync via
 * DataTransfer so the plain form-action submit carries the files.
 */

import { useEffect, useRef, useState } from "react";
import { BlockStack, Button, InlineStack, Text } from "@shopify/polaris";
import { useAdminT } from "../../PolarisShell";

const ACCEPT =
  ".jpg,.jpeg,.png,.gif,.webp,.avif,.svg,.pdf,.txt,.md,.csv,.zip,.doc,.docx,.xls,.xlsx,.mp4,.mov";

export function useAttachments() {
  const [files, setFiles] = useState<File[]>([]);

  return {
    files,
    /** From the picker: the input holds ONLY the new selection —
     * merge it with what state remembers. */
    onPick: (picked: File[]) => setFiles((prev) => [...prev, ...picked]),
    /** Screenshots and copied images paste as files. */
    onPaste: (event: React.ClipboardEvent) => {
      const pasted = Array.from(event.clipboardData?.files ?? []);
      if (pasted.length > 0) {
        event.preventDefault();
        setFiles((prev) => [...prev, ...pasted]);
      }
    },
    removeAt: (index: number) =>
      setFiles((prev) => prev.filter((_, i) => i !== index)),
    reset: () => setFiles([]),
  };
}

export function AttachmentsField({
  attachments,
}: {
  attachments: ReturnType<typeof useAttachments>;
}) {
  const t = useAdminT();
  const inputRef = useRef<HTMLInputElement>(null);

  // State is the source of truth; mirror it into the hidden input so the
  // plain form submit carries exactly the files state remembers.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const transfer = new DataTransfer();
    for (const file of attachments.files) {
      transfer.items.add(file);
    }
    input.files = transfer.files;
  }, [attachments.files]);

  return (
    <BlockStack gap="150">
      <input
        ref={inputRef}
        type="file"
        name="files"
        multiple
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={(event) =>
          attachments.onPick(Array.from(event.target.files ?? []))
        }
      />
      <InlineStack gap="200" blockAlign="center">
        <Button onClick={() => inputRef.current?.click()}>
          {t("forum.attach")}
        </Button>
        <Text as="span" tone="subdued" variant="bodySm">
          {t("forum.attach.hint")}
        </Text>
      </InlineStack>
      {attachments.files.length > 0 ? (
        <BlockStack gap="050">
          {attachments.files.map((file, index) => (
            <InlineStack
              key={`${file.name}-${index}`}
              gap="200"
              blockAlign="center"
            >
              <Text as="span" variant="bodySm">
                📎 {file.name}
              </Text>
              <Button
                size="micro"
                variant="plain"
                onClick={() => attachments.removeAt(index)}
              >
                {t("forum.attach.remove")}
              </Button>
            </InlineStack>
          ))}
        </BlockStack>
      ) : null}
    </BlockStack>
  );
}
