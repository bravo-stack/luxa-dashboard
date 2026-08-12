# Campaign link attribution

The Campaigns workspace creates durable, branded links for the public Platform Audit.
Each campaign groups channel- or creative-specific links, while immutable tracking
fields keep historical reports stable.

## Sources of truth

- Supabase stores campaign/link definitions, UTC daily redirect-request aggregates,
  lead submissions, and CRM outcomes.
- Umami stores privacy-safe loaded-arrival and audit-start signals.
- The public funnel resolves `https://www.luxasolution.com/go/{code}` and appends the
  standard UTM values, the campaign `utm_id`, and the individual `luxa_link` code.

Redirect requests can include bots and link-preview scanners. They are request volume,
not unique people. Campaign redirect storage contains no IP addresses, user agents,
cookies, raw referrers, or individual click records.

## Operating rules

1. Create one campaign for the marketing initiative.
2. Create a distinct link for every channel, partner, placement, or creative.
3. Share the branded `/go/{code}` URL, not a hand-built UTM URL.
4. Rename display labels when needed, but duplicate a link to change tracking fields.
5. Archive old records instead of deleting them. Published links remain live.
6. Read first touch as acquisition and last touch as the final return path.

The dashboard migration must be applied before the funnel route is used. Deploy the
funnel resolver before making the Campaigns page available to administrators.
