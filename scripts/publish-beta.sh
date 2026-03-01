#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

TOPO_ORDER=(
  # Level 0: no @typed/* dependencies
  packages/async-data
  packages/fx
  packages/guard
  packages/id
  packages/virtual-modules
  # Level 1: depend only on level 0
  packages/navigation
  packages/template
  packages/virtual-modules-compiler
  packages/virtual-modules-ts-plugin
  packages/virtual-modules-vite
  packages/virtual-modules-vscode
  # Level 2
  packages/router
  packages/tsconfig
  # Level 3
  packages/app
  packages/ui
  # Level 4
  packages/vite-plugin
)

add_files_field() {
  node -e "
    const fs = require('fs');
    const path = require('path');
    const pkgPath = path.resolve(process.argv[1], 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (!pkg.files) {
      const files = ['dist', 'src'];
      pkg.files = files;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('  Added files field:', JSON.stringify(files));
    }
  " "$1"
}

echo -e "${CYAN}=== Typed Beta Publish ===${NC}"
echo ""

echo -e "${YELLOW}Step 1: Verifying npm auth...${NC}"
NPM_USER=$(npm whoami 2>&1) || { echo -e "${RED}Not logged into npm. Run: npm login${NC}"; exit 1; }
echo -e "  Logged in as: ${GREEN}${NPM_USER}${NC}"
echo ""

echo -e "${YELLOW}Step 2: Bumping prerelease versions...${NC}"
for dir in "${TOPO_ORDER[@]}"; do
  name=$(node -p "require('./$dir/package.json').name")
  old_ver=$(node -p "require('./$dir/package.json').version")
  (cd "$dir" && npm version prerelease --preid=beta --no-git-tag-version > /dev/null 2>&1)
  new_ver=$(node -p "require('./$dir/package.json').version")
  printf "  %-45s %s -> %s\n" "$name" "$old_ver" "$new_ver"
done
echo ""

echo -e "${YELLOW}Step 3: Adding 'files' fields to package.json (keeps tarballs clean)...${NC}"
for dir in "${TOPO_ORDER[@]}"; do
  name=$(node -p "require('./$dir/package.json').name")
  printf "  %-45s" "$name"
  add_files_field "$dir"
done
echo ""

echo -e "${YELLOW}Step 4: Building all packages...${NC}"
pnpm build
echo -e "${GREEN}  Build complete.${NC}"
echo ""

echo -e "${YELLOW}Step 5: Dry-run (checking tarball sizes)...${NC}"
for dir in "${TOPO_ORDER[@]}"; do
  name=$(node -p "require('./$dir/package.json').name")
  version=$(node -p "require('./$dir/package.json').version")
  size=$(cd "$dir" && npm pack --dry-run 2>&1 | grep "unpacked size" | sed 's/.*unpacked size: //' || echo "unknown")
  printf "  %-45s %s @ %s\n" "$name" "$version" "$size"
done
echo ""

echo -e "${YELLOW}Step 6: Publishing (tag=beta)...${NC}"

if [ -n "${NPM_TOKEN:-}" ]; then
  echo -e "  Using NPM_TOKEN (no OTP needed)"
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > "$ROOT/.npmrc.publish"
  NPM_AUTH_ARGS="--userconfig=$ROOT/.npmrc.publish"
  trap 'rm -f "$ROOT/.npmrc.publish"' EXIT
else
  echo -e "  ${CYAN}No NPM_TOKEN set. Will prompt for OTP codes (from your authenticator app).${NC}"
  echo -e "  ${CYAN}Tip: create a granular access token at https://www.npmjs.com/settings/tokens to skip OTP.${NC}"
  NPM_AUTH_ARGS=""
  read -rp "$(echo -e "${CYAN}Enter npm OTP code: ${NC}")" OTP
fi
echo ""

PUBLISHED=()
FAILED=()

publish_one() {
  local dir="$1"
  if [ -n "${NPM_TOKEN:-}" ]; then
    (cd "$dir" && pnpm publish --tag beta --access public $NPM_AUTH_ARGS 2>&1)
  else
    (cd "$dir" && pnpm publish --tag beta --access public --otp="$OTP" 2>&1)
  fi
}

for dir in "${TOPO_ORDER[@]}"; do
  name=$(node -p "require('./$dir/package.json').name")
  version=$(node -p "require('./$dir/package.json').version")
  printf "  Publishing %-45s ... " "$name@$version"

  while true; do
    OUTPUT=$(publish_one "$dir") && {
      echo -e "${GREEN}OK${NC}"
      PUBLISHED+=("$name@$version")
      break
    }

    if echo "$OUTPUT" | grep -q "EOTP\|one-time password"; then
      echo -e "${YELLOW}OTP expired${NC}"
      read -rp "$(echo -e "  ${CYAN}Enter new OTP code: ${NC}")" OTP
      printf "  Publishing %-45s ... " "$name@$version"
    elif echo "$OUTPUT" | grep -q "403.*previously published\|cannot publish over"; then
      echo -e "${YELLOW}SKIP (already published)${NC}"
      break
    else
      echo -e "${RED}FAILED${NC}"
      echo "$OUTPUT" | tail -5 | sed 's/^/    /'
      FAILED+=("$name@$version")
      break
    fi
  done
done

echo ""
echo -e "${CYAN}=== Summary ===${NC}"
echo ""

if [ ${#PUBLISHED[@]} -gt 0 ]; then
  echo -e "${GREEN}Published (${#PUBLISHED[@]}):${NC}"
  for p in "${PUBLISHED[@]}"; do
    echo "  - $p"
  done
fi

if [ ${#FAILED[@]} -gt 0 ]; then
  echo ""
  echo -e "${RED}Failed (${#FAILED[@]}):${NC}"
  for f in "${FAILED[@]}"; do
    echo "  - $f"
  done
  exit 1
fi

echo ""
echo -e "${GREEN}All packages published successfully!${NC}"
