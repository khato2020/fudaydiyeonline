<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Data access goes through the browser Supabase client with RLS (no server functions yet); merchant ownership is enforced by RLS via merchants.owner_id. Why: simple MVP with row-level ownership.
- Checkout creates one order per merchant; order status flow lives in src/lib/order-status.ts and currency math in src/lib/currency.ts (both unit-tested). Why: single source of truth for business rules.
- Product images use a private bucket with long-lived signed URLs stored on the product, because public buckets are blocked in this workspace.
