/**
 * ROLE OF THIS FILE
 * Unit coverage for the company legal-identity formatter (lib/company.ts):
 * blank owner data must produce nothing at all — no stub footer in an email,
 * no half-filled legal notice — and a complete identity must keep the
 * owner's line order. Runs under plain Node: `npm run test:unit`.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  companyEmailFooter,
  companyPostalLines,
  hasCompanyName,
  hasPostalIdentity,
} from "../../lib/company.ts";

const FILLED = {
  name: "ELDREVE",
  legal_name: "Example Trading Co., Ltd.",
  registration_number: "91440300MA5XXXXX",
  address_lines: ["Room 1201, 88 Example Road", "Shenzhen 518000", "China"],
  contact_email: "support@eldreve.com",
  order_number_prefix: "#",
};

const BLANK = {
  name: "ELDREVE",
  legal_name: "",
  registration_number: "",
  address_lines: [],
  contact_email: "support@eldreve.com",
  order_number_prefix: "#",
};

test("postal lines are legal name then address, in the owner's order", () => {
  assert.deepEqual(companyPostalLines(FILLED), [
    "Example Trading Co., Ltd.",
    "Room 1201, 88 Example Road",
    "Shenzhen 518000",
    "China",
  ]);
});

test("blank and whitespace-only entries are dropped, survivors trimmed", () => {
  assert.deepEqual(
    companyPostalLines({
      legal_name: "  Example Co.  ",
      address_lines: ["", "   ", " 88 Example Road ", "China"],
    }),
    ["Example Co.", "88 Example Road", "China"],
  );
});

test("a name alone is publishable — the address must not gate it", () => {
  // The TikTok rejection (2026-08-06) was exactly this case: an entity name
  // existed but nothing showed on the site.
  assert.equal(hasCompanyName({ legal_name: "Example Co." }), true);
  assert.equal(hasCompanyName(FILLED), true);
  assert.equal(hasCompanyName(BLANK), false);
  assert.equal(hasCompanyName({ legal_name: "   " }), false);
  assert.equal(hasCompanyName({}), false);
});

test("a postal identity needs BOTH the name and an address line", () => {
  assert.equal(hasPostalIdentity(FILLED), true);
  assert.equal(hasPostalIdentity(BLANK), false);
  assert.equal(
    hasPostalIdentity({ legal_name: "Example Co.", address_lines: [] }),
    false,
  );
  assert.equal(
    hasPostalIdentity({ legal_name: "", address_lines: ["China"] }),
    false,
  );
  assert.equal(
    hasPostalIdentity({ legal_name: "   ", address_lines: ["  "] }),
    false,
  );
  assert.equal(hasPostalIdentity({}), false);
});

test("email footer carries brand, postal block, then contact email", () => {
  assert.equal(
    companyEmailFooter(FILLED),
    [
      "ELDREVE",
      "Example Trading Co., Ltd.",
      "Room 1201, 88 Example Road",
      "Shenzhen 518000",
      "China",
      "support@eldreve.com",
    ].join("\n"),
  );
});

test("no postal address → empty footer, never a stub", () => {
  assert.equal(companyEmailFooter(BLANK), "");
  assert.equal(companyEmailFooter({}), "");
  // A name without an address does not satisfy CAN-SPAM, so no footer.
  assert.equal(
    companyEmailFooter({ name: "ELDREVE", legal_name: "Example Co." }),
    "",
  );
});
