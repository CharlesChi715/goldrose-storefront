/**
 * ROLE OF THIS FILE
 * /admin/customers — clone-lite list (§9.7): Name, Location, Orders,
 * Amount spent; CSV export. Customers are auto-created from paid orders.
 */

import { listCustomers } from "@/lib/admin/orders";
import { CustomersList, type CustomerListItem } from "./CustomersList";

export default async function CustomersPage() {
  const rows = await listCustomers();
  const items: CustomerListItem[] = rows.map(({ customer, ordersCount, totalSpentCents, location }) => ({
    id: customer.id,
    name: `${customer.first_name} ${customer.last_name}`.trim() || customer.email,
    email: customer.email,
    location,
    ordersCount,
    totalSpentCents,
  }));
  return <CustomersList items={items} />;
}
