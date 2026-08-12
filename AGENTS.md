<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Delivery workflow

For every implementation task:

1. Work on the `staging` branch. Create it from `main` only when it does not yet exist.
2. Keep all work for the task on `staging` and preserve unrelated user changes.
3. Run the repository quality gates before completion.
4. Commit the completed work with a conventional commit message.
5. Push `staging` and open a pull request from `staging` to `main`.
6. Include the pull-request URL in the final handoff.

Do not leave completed implementation work uncommitted or commit it directly to `main`.
