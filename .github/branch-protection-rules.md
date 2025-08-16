# Branch Protection Rules

This document outlines the recommended branch protection rules for the Nodey repository.

## Main Branch Protection

### Required Settings for `main` branch:

1. **Require pull request reviews before merging**
   - Required number of reviewers: 1
   - Dismiss stale reviews when new commits are pushed: ✅
   - Require review from code owners: ✅ (if CODEOWNERS file exists)

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✅
   - Required status checks:
     - `CI / Test & Build (18.x)`
     - `CI / Test & Build (20.x)`
     - `CI / Dependency Review`
     - `CodeRabbit` (if enabled)

3. **Require conversation resolution before merging**: ✅

4. **Require signed commits**: ❌ (optional)

5. **Require linear history**: ✅ (prevents merge commits)

6. **Include administrators**: ✅ (applies rules to admins too)

7. **Allow force pushes**: ❌

8. **Allow deletions**: ❌

## Staging Branch Protection (if used)

### Required Settings for `staging` branch:

1. **Require pull request reviews before merging**
   - Required number of reviewers: 1

2. **Require status checks to pass before merging**
   - Required status checks:
     - `CI / Test & Build (20.x)`

3. **Allow force pushes**: ❌

## Feature Branch Rules

Feature branches (prefixed with `feature/`, `fix/`, `hotfix/`) should:

- **Cannot deploy directly** (blocked by deploy.yml workflow)
- **Must merge via PR** to main or staging
- **Must pass all CI checks**

## Deployment Rules

### Production Deployment (`main` branch only)
- ✅ Automatic deployment on push to main
- ✅ Manual deployment via workflow_dispatch
- ✅ Full test suite required
- ✅ Environment protection can be added

### Staging Deployment (`staging` branch only)
- ✅ Automatic deployment on push to staging
- ✅ Manual deployment via workflow_dispatch
- ✅ Basic checks required

### Blocked Deployment
- ❌ Feature branches (`feature/*`, `fix/*`, `hotfix/*`)
- ❌ Any other branches not explicitly allowed

## GitHub CLI Commands

To apply these rules via GitHub CLI:

```bash
# Main branch protection
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / Test & Build (18.x)","CI / Test & Build (20.x)","CI / Dependency Review"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field required_linear_history=true \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true

# Staging branch protection (if staging branch exists)
gh api repos/:owner/:repo/branches/staging/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["CI / Test & Build (20.x)"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null \
  --field allow_force_pushes=false
```

Replace `:owner` and `:repo` with your actual repository owner and name.

## Manual Setup via GitHub Web Interface

1. Go to your repository settings
2. Navigate to "Branches" in the left sidebar
3. Click "Add rule" next to "Branch protection rules"
4. Enter branch name pattern: `main`
5. Configure the protection settings as outlined above
6. Repeat for `staging` if using a staging branch

## Environment Protection (Optional)

For additional security, you can set up environment protection:

1. Go to Settings → Environments
2. Create environments: `production`, `staging`
3. Add protection rules:
   - Required reviewers
   - Wait timer
   - Deployment branches (restrict to specific branches)

This ensures that even if someone bypasses branch protection, they cannot deploy without additional approval.
