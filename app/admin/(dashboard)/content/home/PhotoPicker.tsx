"use client";

/**
 * ROLE OF THIS FILE
 * The "Change photo" dialog for an `image` field on Content → Home page.
 *
 * WHAT IT IS FOR
 * A teammate replacing a homepage picture should never have to know what a
 * path is. The dialog therefore offers, in the order people actually reach for
 * them: upload a new photo, pick one already uploaded, or put the design's
 * original back. Typing a path is still possible — it is how you point at an
 * asset that ships in the repo — but it is the last option, folded away.
 *
 * WHY THE SIZE ADVICE IS SO PROMINENT
 * The homepage is a fixed 430-wide stage, so every picture lands in a box of a
 * size somebody chose in Figma. Whether a replacement looks right depends
 * entirely on its shape, and that is knowable BEFORE the upload — so the box
 * size and the fit rule are stated at the top of the dialog rather than left to
 * be discovered on the live page.
 */

import { useRef, useState, useTransition } from "react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  InlineGrid,
  InlineStack,
  Modal,
  Text,
  TextField,
} from "@shopify/polaris";
import { useAdminLang, useAdminT } from "../../../PolarisShell";
import { ImageFramer } from "../../products/ImageFramer";
import type { SpotlightArea } from "@/lib/home-content/frames";
import { uploadHomePhotoAction } from "./actions";

/** One already-uploaded file, offered as a choice in the picker. */
export type LibraryItem = { path: string; url: string; name: string };

/**
 * The photo dialog.
 *
 * @param open - Whether the dialog is showing.
 * @param label - The field's own label, e.g. "Slide 1 photo".
 * @param value - The path currently in the draft.
 * @param defaultValue - The design's own photo, offered as "put it back".
 * @param previewUrl - A browser-usable URL for `value`.
 * @param box - The design box this photo is drawn into, if the registry knows it.
 * @param fit - How the photo is fitted into that box.
 * @param library - Files already uploaded, newest first.
 * @param onChange - Called with the chosen path.
 * @param onClose - Called when the dialog should close.
 * @param frame - How the current photo is framed inside that box.
 * @param onFrameChange - Called as the owner drags or zooms the framing.
 * @param onUploaded - Called after a successful upload so the page can refresh
 *   its library.
 */
export function PhotoPicker({
  open,
  label,
  value,
  defaultValue,
  previewUrl,
  box,
  fit,
  library,
  frame,
  onChange,
  onFrameChange,
  onClose,
  onUploaded,
}: {
  open: boolean;
  label: string;
  value: string;
  defaultValue: string;
  previewUrl: string;
  box: { w: number; h: number } | null;
  fit: "cover" | "stretch" | "window" | null;
  library: LibraryItem[];
  frame: SpotlightArea;
  onChange: (path: string) => void;
  onFrameChange: (area: SpotlightArea) => void;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const t = useAdminT();
  const lang = useAdminLang();
  const zh = lang === "zh";
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  // Seeded once from the field being opened. The parent unmounts this dialog
  // when it closes and keys it by field, so there is no stale-draft case to
  // synchronize away — which is why there is no effect here.
  const [typed, setTyped] = useState(value);

  function upload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setError(null);
    const form = new FormData();
    form.append("file", file);
    startUpload(async () => {
      const result = await uploadHomePhotoAction(form);
      if (fileInput.current) fileInput.current.value = "";
      if (!result.ok || !result.path) {
        setError(result.error ?? t("home.photo.uploadFailed"));
        return;
      }
      // Choose it immediately: uploading a photo into this dialog can only
      // mean "use this one".
      onChange(result.path);
      onUploaded();
      onClose();
    });
  }

  const fitHelp =
    fit === "cover"
      ? t("home.photo.fit.cover")
      : fit === "stretch"
        ? t("home.photo.fit.stretch")
        : fit === "window"
          ? t("home.photo.fit.window")
          : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t("home.photo.title")} — ${label}`}
      secondaryActions={[{ content: t("common.cancel"), onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          {/* What has to be true of the replacement, before anything is chosen. */}
          {box ? (
            <Banner tone={fit === "stretch" ? "warning" : "info"}>
              <BlockStack gap="100">
                <Text as="p" variant="bodyMd" fontWeight="semibold">
                  {t("home.photo.size")} {box.w} × {box.h}
                  {zh ? " 像素" : " px"}
                </Text>
                {fitHelp ? <Text as="p">{fitHelp}</Text> : null}
              </BlockStack>
            </Banner>
          ) : null}

          {error ? (
            <Banner tone="critical" onDismiss={() => setError(null)}>
              <p>{error}</p>
            </Banner>
          ) : null}

          {/* What is on the page right now. */}
          <Card>
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center">
                <Text as="h3" variant="headingSm">
                  {t("home.photo.current")}
                </Text>
                {value === defaultValue ? (
                  <Badge>{t("home.photo.isDesign")}</Badge>
                ) : (
                  <Badge tone="info">{t("home.edited")}</Badge>
                )}
              </InlineStack>
              {/* THE FRAME, not a letterboxed thumbnail.
                  This preview used to be `object-fit: contain` — the whole
                  photo, shrunk to fit — while the page draws `cover` and
                  trims. So the owner approved one picture and published a
                  different one, and the only way to find out was to look at
                  the live site. This is the box at its TRUE size with the
                  photo cover-fitted inside it: what stays in is what shows.
                  Drag to pan, pull the zoom to tighten in.
                  Only for a REPLACED photo: while the value is still the
                  design's own, the page draws Figma's traced geometry and a
                  frame would be a second answer to the same question. */}
              {box && value !== defaultValue ? (
                <ImageFramer
                  url={previewUrl}
                  alt={label}
                  box={box}
                  area={frame}
                  hint={t("home.photo.frame.hint")}
                  fitsHint={t("home.photo.frame.fits")}
                  zoomLabel={t("home.photo.frame.zoom")}
                  onChange={onFrameChange}
                />
              ) : (
                <Box
                  background="bg-surface-secondary"
                  borderRadius="200"
                  padding="200"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt=""
                    style={{
                      display: "block",
                      maxWidth: "100%",
                      maxHeight: 180,
                      margin: "0 auto",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              )}
              {box && value !== defaultValue ? null : (
                <Text as="p" variant="bodySm" tone="subdued">
                  {t("home.photo.frame.designOnly")}
                </Text>
              )}
            </BlockStack>
          </Card>

          <InlineStack gap="200">
            <Button
              variant="primary"
              loading={uploading}
              onClick={() => fileInput.current?.click()}
            >
              {t("home.photo.upload")}
            </Button>
            <Button
              disabled={value === defaultValue || uploading}
              onClick={() => {
                onChange(defaultValue);
                onClose();
              }}
            >
              {t("home.photo.useDesign")}
            </Button>
          </InlineStack>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={(event) => upload(event.target.files)}
          />

          {/* Everything already uploaded, so a photo used twice is one click. */}
          <BlockStack gap="200">
            <Text as="h3" variant="headingSm">
              {t("home.photo.library")}
            </Text>
            {library.length === 0 ? (
              <Text as="p" tone="subdued">
                {t("home.photo.libraryEmpty")}
              </Text>
            ) : (
              <InlineGrid columns={{ xs: 3, md: 5 }} gap="200">
                {library.map((item) => (
                  <button
                    key={item.path}
                    type="button"
                    title={item.name}
                    onClick={() => {
                      onChange(item.path);
                      onClose();
                    }}
                    style={{
                      padding: 0,
                      border:
                        item.path === value
                          ? "2px solid #005bd3"
                          : "1px solid #e3e3e3",
                      borderRadius: 8,
                      overflow: "hidden",
                      background: "#fff",
                      cursor: "pointer",
                      aspectRatio: "1 / 1",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.name}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </button>
                ))}
              </InlineGrid>
            )}
          </BlockStack>

          {/* Last resort: point at an asset that ships with the site. */}
          {manual ? (
            <BlockStack gap="200">
              <TextField
                label={t("home.photo.path")}
                value={typed}
                autoComplete="off"
                helpText={t("home.photo.pathHelp")}
                onChange={setTyped}
              />
              <InlineStack gap="200">
                <Button
                  onClick={() => {
                    onChange(typed.trim());
                    onClose();
                  }}
                >
                  {t("home.photo.usePath")}
                </Button>
                <Button variant="plain" onClick={() => setManual(false)}>
                  {t("common.cancel")}
                </Button>
              </InlineStack>
            </BlockStack>
          ) : (
            <Button variant="plain" onClick={() => setManual(true)}>
              {t("home.photo.enterPath")}
            </Button>
          )}
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
