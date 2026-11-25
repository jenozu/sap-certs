# Owner actions

Things only you can do: they need your logins or secret values, which Claude never handles. Each item says which task needs it. Nothing here is needed until the revised plan is approved.

## Before Phase 1 starts

| # | Action | For task |
|---|---|---|
| A1 | Approve plan revision 2 (reply "approved"). | 1 |
| A2 | Grant push access when prompted for `jenozu/playground`. | 5, 13 |
| A3 | **Sites export:** open the ChatGPT Sites version of Pathway → footer → **Export workspace** → save the JSON. Skip this if you never used the Sites version. | 2 |
| A4 | **Neon export:** open the latest preview deployment of `career-roadmap` (signed in to Vercel) → **Export workspace** → save the JSON. | 2 |
| A5 | **Neon backup branch:** Neon console → your project → Branches → *Create branch* from `main`, named `backup-pre-v2`. | 2 |
| A6 | **Neon inventory:** in the Neon SQL editor on `main`, run the query below and paste the output (it contains no workspace content). | 2 |

```sql
SELECT left(user_id, 12) AS owner_prefix, version, length(data::text) AS bytes,
       md5(data::text) AS data_md5,
       jsonb_array_length(data->'items') AS items,
       (SELECT count(*) FROM jsonb_object_keys(data->'sessions')) AS sessions
FROM workspaces;
```

Send A3/A4 files by attaching them in this chat (they stay out of the repo). Claude compares them and lists differing items so you can choose which version to keep.

## During Phase 1

| # | Action | For task |
|---|---|---|
| A7 | Neon: create branch `preview` from `main`. In Vercel → `career-roadmap` → Settings → Environment Variables: edit `DATABASE_URL` so it applies to **Production only**, then add a new `DATABASE_URL` for **Preview** using the `preview` branch's connection string. | 3 |
| A8 | Confirm the full `user_id` of your Neon row is used as `OWNER_ID` in production. Claude sets it from the task-2 output; you only confirm. | 6 |
| A9 | Vercel → Settings → Deployment Protection → *Protection Bypass for Automation* → create a secret, then add it to GitHub → `jenozu/sap-certs` → Settings → Secrets → Actions as `VERCEL_AUTOMATION_BYPASS_SECRET`. | 8 |
| A10 | Approve each production release (Release 0 onward) after reviewing the preview. | 11, 23, 27, 30, 34, 40, 44 |
| A11 | After Release 0, confirm the Sites data is safely in Neon so the Sites scaffolding can be removed. | 12 |

## Later

| # | Action | For task |
|---|---|---|
| A12 | Review 5 sample priority exercises before Release 1. | 18 |
| A13 | Update your ChatGPT job-watch automation's output to the `pathway.jobs.v1` format (Claude supplies a paste-ready instruction). | 29 |
