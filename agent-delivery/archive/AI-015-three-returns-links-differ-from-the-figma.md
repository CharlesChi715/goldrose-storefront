<!-- Closed agent-inbox matter. Private working record — an AI agent
     must ask Charles before reading anything in this folder. -->

## AI-015 · `AGENT-DECISION` · returns-flow wiring where labels beat the prototype

- **Where:** [`components/screens/returns/RequestSubmittedScreen.tsx`](../../components/screens/returns/RequestSubmittedScreen.tsx)
  (representative; details in docs/ixd 08-02).
- **What:** three places where the built links differ from the clickable
  Figma prototype, each in the customer's favour:
  1. **"Back to Orders"** → `/account/orders`. The prototype sent it back to
     the returns start page, which contradicts its own label.
  2. **"Track Status"** → the after-sales status tab. In Figma this one
     button carries **two** triggers: a normal click opens "Return Approved",
     and a *drag* opens "Request Not Approved". A drag trigger fires when you
     press and pull on the element — designers use it to demo a second
     outcome without drawing a second button. It is a presentation trick, not
     a real interaction: in the shop, which of those two screens a customer
     sees is decided by our review of their request, not by how they touch
     the button. So the button goes to the status list, which shows whichever
     outcome is true.
  3. **"Track Package"** on the approved screen stays dead. It means the
     parcel the customer ships *back*, and nothing tracks return shipments —
     pointing it at `/orders/track` would show them an unrelated outbound
     delivery.
- **Charles (08-02):** "confirmed — which page to open should [be] according
  to returns request approved or not… it should just show whatever status is,
  not by drag." The built wiring stands.
- **Follow-up for the design team (relay text in AI-011, reply 2):** a button
  whose destination depends on real data should not be demonstrated with a
  second trigger. Three honest ways to express it in Figma, best first:
  1. **One card per state in a list** — what they already drew on 2030:188:
     each request card carries its own status chip and links to its own
     outcome screen. Nothing to change; this is the pattern we wired.
  2. **A Dev Mode annotation on the button** — leave it unwired and write
     "opens the screen matching this request's current status", so the
     prototype does not imply a fixed destination.
  3. **Variables + conditional interaction** — set a `returnStatus` variable
     and branch the click (`if approved → A, else → B`) when they want the
     prototype to feel real. More setup, but it is Figma's own answer to
     "the destination depends on data".
- **Closed:** 2026-08-02
- **Why:** answered — Charles confirmed the destination must follow the real return status, not the prototype's drag trigger; Figma-representation guidance relayed via AI-011
