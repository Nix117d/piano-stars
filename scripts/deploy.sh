#!/bin/sh
# Builds Piano Stars for GitHub Pages and pushes the result to the gh-pages branch
# of this repository's `origin` remote. The app is then served at
# https://<user>.github.io/piano-stars/
set -e
cd "$(dirname "$0")/.."

REMOTE=$(git remote get-url origin)
SOURCE=$(git rev-parse --short HEAD)

BASE_PATH=/piano-stars/ npm run build
touch dist/.nojekyll

cd dist
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy Piano Stars ($SOURCE)"
git push -f "$REMOTE" gh-pages
rm -rf .git
echo "Deployed $SOURCE to the gh-pages branch."
