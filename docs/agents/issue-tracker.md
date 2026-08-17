# Issue tracker: GitHub

Issues and specs for this repository live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open --json number,title,body,labels,comments`
- Comment: `gh issue comment <number> --body "..."`
- Label: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- Close: `gh issue close <number> --comment "..."`

Run commands inside this clone so `gh` infers `Stringsaeed/money-management` from the remote.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## Skill conventions

- “Publish to the issue tracker” means create a GitHub issue.
- “Fetch the relevant ticket” means run `gh issue view <number> --comments`.
- Wayfinder maps use a parent GitHub issue and linked child issues.
- Represent blocking edges with GitHub issue dependencies when available; otherwise use a `Blocked by: #<number>` line.
- Claim work by assigning the issue to the current GitHub user.
- Resolve work by recording the result and closing the issue.
