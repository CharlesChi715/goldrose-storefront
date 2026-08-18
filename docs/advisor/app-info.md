# What the advisor is allowed to know

> ⚠️ THIS FILE IS THE ALLOWLIST. Every word here is sent to Anthropic on every
> turn, and the advisor knows nothing about ELDREVE beyond it. Adding a line
> grants knowledge; deleting a line revokes it. Review changes in `git diff`
> the same way you would review a permission change.
>
> Do NOT put here: secrets, API keys, customer names or emails, supplier
> pricing you would not show a teammate, or anything you cannot honour if a
> boss repeats it to a customer.

## The business

- ELDREVE sells 24K gold-dipped roses as gifts, direct to consumers.
- First market is the United States. Europe is possible later.
- The website is <https://eldreve.com>.

## Who is who

- A frontend UI design team designs how the site looks and behaves.
- Charles owns every technical decision and implementation.

## What the site can do today

<!-- Keep each line a plain business fact, not a technical one.
     Good:  "Customers can pay with PayPal."
     Bad:   "PayPal Advanced Checkout via lib/paypal adapter." -->

- Two roses are on sale: a 24K gold-dipped eternal rose, and a ruby-red
  gold-trimmed eternal rose.
- Customers can browse the shop, open a product page, and search the site.
- Customers can put a rose in the bag and buy it. The payment is taken by
  PayPal, and a real customer payment has been taken this way.
- Discount codes work: a valid code lowers the price during checkout.
- Customers can write a review of a product. A review only appears on the
  site after someone on our side publishes it.
- The published policy pages are: shipping and delivery, returns, refunds and
  cancellations, warranty and care, privacy, terms of service, email and SMS
  terms, and contact and legal.
- We have an admin area only our team can sign in to. From it we manage
  products, orders, customers, discounts, and the words shown on the site, and
  we can see how the site is being used.
- The team has its own private forum inside the admin area for discussing work.

## What is not ready yet

<!-- Being honest here is what stops the advisor promising things we cannot do.
     Good:  "We cannot take credit cards yet — PayPal only."               -->

-

## How we want to work

<!-- Guidance the advisor can lean on when asked "how do I improve my work".
     Good:  "Decisions get written down before they get built."            -->

- Decisions get written down before they get built, so anyone can see why a
  thing was done that way months later.
- An idea is first written in the words of the person who had it. It is only
  reshaped once they agree the meaning survived.
- Each piece of work is built and previewed on its own before it joins the
  live site, so a change can be looked at before customers see it.
- Every fact has one home. If something is worth knowing twice, we link to it
  rather than copy it, so there is never a newer and an older version.
- We do not tell a customer something we cannot honour. A promise about price,
  stock, delivery or returns is only made once it is actually true.
