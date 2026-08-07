/**
 * ROLE OF THIS FILE
 * /account/addresses — the saved-address book (Figma ADDRESS-BOOK 2118:247,
 * imported 2026-08-07), reached from the dashboard's "Manage Addresses" row.
 * Visual placeholder: there is no address backend yet, so the frame's own
 * three addresses render and the add / edit sheet persists nothing.
 */

import type { Metadata } from "next";
import { AddressBookScreen } from "@/components/screens/AddressBookScreen";

export const metadata: Metadata = {
  title: "Address book — ELDREVE",
  robots: { index: false },
};

export default function AddressesPage() {
  return <AddressBookScreen />;
}
