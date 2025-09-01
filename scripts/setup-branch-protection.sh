#!/bin/bash

# Script to set up branch protection rules for Nodey repository
# Requires GitHub CLI (gh) to be installed and authenticated

set -e

REPO_OWNER="Justin322322"
REPO_NAME="Nodey"

echo "Setting up branch protection rules for $REPO_OWNER/$REPO_NAME"

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Not authenticated with GitHub CLI. Please run 'gh auth login' first."
    exit 1
fi

echo "GitHub CLI is ready"

# Function to apply branch protection
apply_branch_protection() {
    local branch=$1
    local contexts=$2
    local reviewers=$3
    
    echo "Protecting branch: $branch"
    
    gh api repos/$REPO_OWNER/$REPO_NAME/branches/$branch/protection \
        --method PUT \
        --field required_status_checks="{\"strict\":true,\"contexts\":$contexts}" \
        --field enforce_admins=true \
        --field required_pull_request_reviews="{\"required_approving_review_count\":$reviewers,\"dismiss_stale_reviews\":true,\"require_code_owner_reviews\":true}" \
        --field restrictions=null \
        --field required_linear_history=true \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field required_conversation_resolution=true
    
    echo "Protected branch: $branch"
}

# Main branch protection
echo "Applying protection to main branch..."
MAIN_CONTEXTS='["CI / Test & Build (18.x)","CI / Test & Build (20.x)","CI / Dependency Review"]'
apply_branch_protection "main" "$MAIN_CONTEXTS" 1

# Check if staging branch exists
if gh api repos/$REPO_OWNER/$REPO_NAME/branches/staging &> /dev/null; then
    echo "Applying protection to staging branch..."
    STAGING_CONTEXTS='["CI / Test & Build (20.x)"]'
    apply_branch_protection "staging" "$STAGING_CONTEXTS" 1
else
    echo "Staging branch not found, skipping..."
fi

echo ""
echo "Branch protection rules applied successfully!"
echo ""
echo "Summary of protections:"
echo "   Pull request reviews required (1 reviewer)"
echo "   Status checks must pass"
echo "   Conversations must be resolved"
echo "   Linear history required"
echo "   Force pushes blocked"
echo "   Branch deletions blocked"
echo "   Rules apply to administrators"
echo ""
echo "Next steps:"
echo "   1. Test by creating a PR from a feature branch"
echo "   2. Verify deployment workflows work correctly"
echo "   3. Consider setting up environment protection for production"
echo ""
echo "For more details, see: .github/branch-protection-rules.md"
