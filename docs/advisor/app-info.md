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

### What a customer can do

- Two roses are on sale: a 24K gold-dipped eternal rose, and a ruby-red
  gold-trimmed eternal rose.
- Customers can browse the shop, open a product page, and search the site.
- Customers can put a rose in the bag and buy it. The payment is taken by
  PayPal, and a real customer payment has been taken this way.
- Discount codes work: a valid code lowers the price during checkout.
- Customers can write a review of a product. A review only appears on the
  site after someone on our side publishes it.
- Besides the shop, customers can read the brand story, how a rose is made,
  and a care and help area.
- The published policy pages are: shipping and delivery, returns, refunds and
  cancellations, warranty and care, privacy, terms of service, email and SMS
  terms, and contact and legal.
- The site is built to be found: it publishes a sitemap and a robots file for
  search engines, and a plain-language file written for AI assistants so they
  can describe us correctly.

### What our team can do

<!-- This is the admin area at /admin. Only our own team can sign in. -->

- The admin area is in English and Chinese. Each person sees it in their own
  language, and the two always say the same thing.
- Each team member signs in with their own account, and a new account has to
  be approved by us before it works.
- We create and edit products: their photos, their words, and their price, and
  we can take one off sale.
- We handle orders: the ones customers paid for, draft orders we build by hand
  for someone, and the carts customers left without paying. We can print a
  packing slip for an order.
- We track stock as three numbers — how many we hold, how many are already
  promised to orders, and how many are still sellable — and every change is
  kept with a reason, so a wrong number can be traced.
- We create discount codes in three shapes: a percentage off, a fixed amount
  off, or free shipping.
- We can change certain words on the site ourselves, such as the promotion
  line and policy text, and put any of them back to the original wording.
- We can see how the site is being used: total sales, number of orders,
  average order value, how many visitors turn into buyers, who is on the site
  right now, where visitors came from (channel, campaign, country), which
  products get the most attention, how long people stay on a page and which
  parts of a page hold them, what people typed into search, and which searches
  came back with nothing.
- That last one is worth asking about: searches that found nothing are a
  direct list of what customers came for and did not get.
- The team has its own private forum inside the admin area for discussing
  work, and a written guide explaining how to use the admin area.

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
