/**
 * ROLE OF THIS FILE
 * /admin — Home. Stage 2 ships a welcome card; Stage 7 replaces it with the
 * cloned Shopify Home (metric cards + "things to do" feed, §9.3).
 */

import { HomeWelcome } from "./HomeWelcome";

export default function AdminHomePage() {
  return <HomeWelcome />;
}
