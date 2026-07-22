"use client";

/**
 * ROLE OF THIS FILE
 * Renders docs/USER-GUIDE.md with Polaris typography. Tiny renderer on
 * purpose — the guide sticks to headings (#/##), bullets (-) and paragraphs,
 * so no markdown dependency is needed.
 */

import { BlockStack, Card, List, Page, Text } from "@shopify/polaris";
import { useAdminT } from "../../PolarisShell";

type Block =
  | { kind: "h1" | "h2"; text: string }
  | { kind: "p"; text: string }
  | { kind: "list"; items: string[] };

/** Strip the guide's light emphasis markers (**bold**) — rendered as plain text. */
function plain(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

function parse(markdown: string): Block[] {
  const blocks: Block[] = [];
  // Paragraphs and bullets may wrap across lines; group by blank lines.
  for (const chunk of markdown.split(/\n\s*\n/)) {
    const lines = chunk.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      continue;
    }
    if (lines[0].startsWith("- ")) {
      // A bullet group; a bullet continues until the next "- " line.
      const items: string[] = [];
      for (const line of lines) {
        if (line.startsWith("- ")) {
          items.push(line.slice(2));
        } else if (items.length > 0) {
          items[items.length - 1] += ` ${line}`;
        }
      }
      blocks.push({ kind: "list", items: items.map(plain) });
    } else if (lines[0].startsWith("## ")) {
      blocks.push({ kind: "h2", text: plain(lines[0].slice(3)) });
      for (const line of lines.slice(1)) {
        blocks.push({ kind: "p", text: plain(line) });
      }
    } else if (lines[0].startsWith("# ")) {
      blocks.push({ kind: "h1", text: plain(lines[0].slice(2)) });
      for (const line of lines.slice(1)) {
        blocks.push({ kind: "p", text: plain(line) });
      }
    } else {
      blocks.push({ kind: "p", text: plain(lines.join(" ")) });
    }
  }
  return blocks;
}

export function GuideView({ markdown }: { markdown: string }) {
  const t = useAdminT();
  const blocks = parse(markdown);

  return (
    <Page title={t("nav.guide")}>
      <Card>
        {blocks.length === 0 ? (
          <Text as="p" tone="subdued">
            {t("guide.missing")}
          </Text>
        ) : (
          <BlockStack gap="300">
            {blocks.map((block, index) => {
              if (block.kind === "h1") {
                return (
                  <Text key={index} as="h2" variant="headingLg">
                    {block.text}
                  </Text>
                );
              }
              if (block.kind === "h2") {
                return (
                  <Text key={index} as="h3" variant="headingSm">
                    {block.text}
                  </Text>
                );
              }
              if (block.kind === "list") {
                return (
                  <List key={index} type="bullet">
                    {block.items.map((item, itemIndex) => (
                      <List.Item key={itemIndex}>{item}</List.Item>
                    ))}
                  </List>
                );
              }
              return (
                <Text key={index} as="p">
                  {block.text}
                </Text>
              );
            })}
          </BlockStack>
        )}
      </Card>
    </Page>
  );
}
