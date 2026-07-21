"use client";

/**
 * ROLE OF THIS FILE
 * Client half of Content → Files (§9.8): upload button, preview grid, copy
 * URL, delete with confirm.
 */

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BlockStack,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Modal,
  Page,
  Text,
  Toast,
} from "@shopify/polaris";
import { useAdminT } from "../../../PolarisShell";
import { deleteFileAction, uploadFilesAction } from "./actions";

export type FileItem = {
  path: string;
  url: string;
  name: string;
  size: number;
  uploadedAt: string;
};

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function FilesBrowser({ items }: { items: FileItem[] }) {
  const t = useAdminT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);

  function upload(files: FileList | null) {
    if (!files || files.length === 0) {
      return;
    }
    const formData = new FormData();
    for (const file of Array.from(files)) {
      formData.append("files", file);
    }
    startTransition(async () => {
      await uploadFilesAction(formData);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      router.refresh();
    });
  }

  async function copyUrl(item: FileItem) {
    const absolute = item.url.startsWith("http")
      ? item.url
      : `${window.location.origin}${item.url}`;
    await navigator.clipboard.writeText(absolute);
    setToast(t("files.copied"));
  }

  return (
    <Page
      title={t("nav.content.files")}
      primaryAction={{
        content: t("files.upload"),
        loading: pending,
        onAction: () => fileInputRef.current?.click(),
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => upload(event.target.files)}
      />
      {items.length === 0 ? (
        <Card>
          <Text as="p" tone="subdued">
            {t("files.empty")}
          </Text>
        </Card>
      ) : (
        <InlineGrid columns={{ xs: 2, md: 4 }} gap="300">
          {items.map((item) => (
            <Card key={item.path}>
              <BlockStack gap="200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.url}
                  alt={item.name}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                    borderRadius: 8,
                    border: "1px solid var(--p-color-border)",
                  }}
                />
                <BlockStack gap="050">
                  <Text as="span" variant="bodySm" fontWeight="semibold" truncate>
                    {item.name}
                  </Text>
                  <Text as="span" tone="subdued" variant="bodySm">
                    {formatSize(item.size)}
                  </Text>
                </BlockStack>
                <InlineStack gap="200">
                  <Button size="micro" onClick={() => copyUrl(item)}>
                    {t("files.copyUrl")}
                  </Button>
                  <Button
                    size="micro"
                    tone="critical"
                    variant="plain"
                    onClick={() => setConfirmDelete(item)}
                  >
                    {t("files.delete")}
                  </Button>
                </InlineStack>
              </BlockStack>
            </Card>
          ))}
        </InlineGrid>
      )}

      <Modal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title={t("files.delete.title")}
        primaryAction={{
          content: t("files.delete"),
          destructive: true,
          loading: pending,
          onAction: () =>
            startTransition(async () => {
              if (confirmDelete) {
                await deleteFileAction(confirmDelete.path);
              }
              setConfirmDelete(null);
              router.refresh();
            }),
        }}
        secondaryActions={[{ content: t("common.cancel"), onAction: () => setConfirmDelete(null) }]}
      >
        <Modal.Section>
          <Text as="p">{t("files.delete.body")}</Text>
        </Modal.Section>
      </Modal>

      {toast ? <Toast content={toast} onDismiss={() => setToast(null)} /> : null}
    </Page>
  );
}
