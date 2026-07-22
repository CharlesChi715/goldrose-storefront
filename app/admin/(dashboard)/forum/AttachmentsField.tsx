"use client";

/**
 * ROLE OF THIS FILE
 * Shared attachments control for forum forms (owner request 2026-07-22):
 * an "Attach files" button + paste-to-attach. React state owns the File
 * list; a real hidden <input type="file" name="files"> is kept in sync via
 * DataTransfer so the plain form-action submit carries the files.
 */

import { useRef, useState } from "react";
import { BlockStack, Button, InlineStack, Text } from "@shopify/polaris";
import { useAdminT } from "../../PolarisShell";

const ACCEPT =
  ".jpg,.jpeg,.png,.gif,.webp,.avif,.svg,.pdf,.txt,.md,.csv,.zip,.doc,.docx,.xls,.xlsx,.mp4,.mov";

export function useAttachments() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  /** State is the source of truth; mirror it into the hidden input. */
  const sync = (next: File[]) => {
    setFiles(next);
    if (inputRef.current) {
      const transfer = new DataTransfer();
      for (const file of next) {
        transfer.items.add(file);
      }
      inputRef.current.files = transfer.files;
    }
  };

  return {
    inputRef,
    files,
    /** From the picker: the input already holds ONLY the new selection —
     * merge it with what state remembers. */
    onPick: (picked: File[]) => sync([...files, ...picked]),
    /** Screenshots and copied images paste as files. */
    onPaste: (event: React.ClipboardEvent) => {
      const pasted = Array.from(event.clipboardData?.files ?? []);
      if (pasted.length > 0) {
        event.preventDefault();
        sync([...files, ...pasted]);
      }
    },
    removeAt: (index: number) => sync(files.filter((_, i) => i !== index)),
    reset: () => sync([]),
  };
}

export function AttachmentsField({
  attachments,
}: {
  attachments: ReturnType<typeof useAttachments>;
}) {
  const t = useAdminT();

  return (
    <BlockStack gap="150">
      <input
        ref={attachments.inputRef}
        type="file"
        name="files"
        multiple
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={(event) => attachments.onPick(Array.from(event.target.files ?? []))}
      />
      <InlineStack gap="200" blockAlign="center">
        <Button onClick={() => attachments.inputRef.current?.click()}>
          {t("forum.attach")}
        </Button>
        <Text as="span" tone="subdued" variant="bodySm">
          {t("forum.attach.hint")}
        </Text>
      </InlineStack>
      {attachments.files.length > 0 ? (
        <BlockStack gap="050">
          {attachments.files.map((file, index) => (
            <InlineStack key={`${file.name}-${index}`} gap="200" blockAlign="center">
              <Text as="span" variant="bodySm">
                📎 {file.name}
              </Text>
              <Button size="micro" variant="plain" onClick={() => attachments.removeAt(index)}>
                {t("forum.attach.remove")}
              </Button>
            </InlineStack>
          ))}
        </BlockStack>
      ) : null}
    </BlockStack>
  );
}
