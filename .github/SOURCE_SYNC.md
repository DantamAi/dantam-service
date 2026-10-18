# Dantam Service Desk and Projects — source sync

This repository receives the application source from the existing ChatGPT Site.

- Site project: `appgprj_6ad2f4dec7dc81919347a8bd7dfd084d`
- Live app: https://dantamai-support-desk.dantamai-1635.chatgpt.site
- Initial source: Site version 18, commit `a1beb368da67992f6dfc42d87691b258235e8eeb`
- Source includes Service Desk, Projects, both dashboards, access rules, API routes, schema/migrations, tests and brand assets.

## Synchronization and deployment

This is a source-code copy. No automatic continuous or two-way synchronization or GitHub-triggered deployment is configured. Later Site changes require an explicit source sync to this repository. A GitHub commit alone does not publish changes to the live Site.

Production records, uploaded attachments, credentials, local runtime state, dependencies and build output are not part of the source copy. Production data remains in the Site's D1/R2 storage. Preserve `.openai/hosting.json` when updating the same Site.

Use the supported Sites build, source and deployment workflow to publish app changes. See the root README and package.json for framework commands.
