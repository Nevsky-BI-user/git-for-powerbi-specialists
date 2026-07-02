#!/usr/bin/env bash
# Створює публічний GitHub-репозиторій і публікує курс на GitHub Pages.
# Потрібно: git, GitHub CLI (gh), виконаний `gh auth login`.
set -euo pipefail
REPO="${1:-git-for-powerbi-specialists}"

gh auth status >/dev/null 2>&1 || gh auth login

if [ ! -d .git ]; then
  git init -b main
  git add -A
  git commit -m "feat: initial course release (52 lessons, goal-loop QA, Pages workflow)"
fi

gh repo create "$REPO" --public --source=. --push

# Pages: джерело — GitHub Actions
gh api -X POST "repos/{owner}/${REPO}/pages" -f build_type=workflow >/dev/null 2>&1 \
  || echo "Pages вже увімкнено або ввімкни вручну: Settings → Pages → Source: GitHub Actions"

OWNER=$(gh api user -q .login)
echo ""
echo "Репозиторій: https://github.com/${OWNER}/${REPO}"
echo "Actions:     https://github.com/${OWNER}/${REPO}/actions"
echo "Сайт (після зеленого workflow): https://${OWNER}.github.io/${REPO}/"
