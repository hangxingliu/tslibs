#!/usr/bin/env bash
# shellcheck disable=SC1091

#
# changelogs:
#

throw() { printf "fatal: %s\n" "$1" >&2; exit 1; }
print_cmd() { printf "\$ %s\n" "$*"; }
execute() { print_cmd "$@"; "$@" || throw "Failed to execute '$1'"; }
execute_silently() { print_cmd "$@"; "$@" >/dev/null || throw "Failed to execute '$1'"; }
has_param() {
    local term="$1";
    shift;
    for arg; do [ "$arg" == "$term" ] && return 0; done
    return 1;
}
RED="\x1b[31m";    CYAN="\x1b[36m";   MAGENTA="\x1b[35m";
DIM="\x1b[2m";     RESET="\x1b[0m";


command -v bun >/dev/null || throw "bun is not installed!";
command -v jq >/dev/null || throw "jq is not installed!";


PROJECT_ROOT_DIR="$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )/.." &> /dev/null && pwd )";
PROJECT_ROOT_PKG="${PROJECT_ROOT_DIR}/package.json";

PKG="$(pwd)/package.json";
[ -f "$PKG" ] || throw "No package file '$PKG'";
[ "$PKG" == "$PROJECT_ROOT_PKG" ] && throw "Failed to publish at the monorepo root"

PKG_NAME="$(jq -r '.name' -- "$PKG")";
PKG_VERSION="$(jq -r '.version' -- "$PKG")";
PKG_ACCESS="$(jq -r '.publishConfig.access' -- "$PKG")";
[[ "$PKG_ACCESS" == public ]] || throw "The package '$PKG_NAME' has no 'public' publish config";

DRYRUN=false;
has_param --yes "$@" || DRYRUN=true;

FORMAT="\n\npublishing package ";
if $DRYRUN; then
  FORMAT="${DIM}${FORMAT}${CYAN}%s${RESET}${DIM} @ ${MAGENTA}%s${RESET}${DIM} (dryrun) ...\n\n${RESET}";
else
  FORMAT="${FORMAT}${CYAN}%s${RESET} @ ${MAGENTA}%s${RESET} ...\n\n${RESET}";
fi
# shellcheck disable=SC2059
printf "$FORMAT" "$PKG_NAME" "$PKG_VERSION";
$DRYRUN || sleep 1;

execute bun clean

execute_silently pushd "${PROJECT_ROOT_DIR}";
execute bun build:all
execute_silently popd;

cmd_publish=( bunx npm publish );
copy_args_to_cmd_publish() {
  local arg add_next=false;
  for arg; do
    if $add_next; then
      cmd_publish+=( "$arg" );
      add_next=false;
      continue;
    fi
    case "$arg" in
      --access|--tag)
        cmd_publish+=( "$arg" ); add_next=true;;
      --tolerate-republish|--provenance|--dry-run|-n|--json)
        cmd_publish+=( "$arg" );;
      --otp)
        # shellcheck disable=SC2059
        printf "${RED}Please input OTP > ${RESET}";
        read -r user_otp;
        [ -z "$user_otp" ] && throw "OTP is empty!";
        cmd_publish+=( --otp "$user_otp" );

        printf "\nOTP: ${CYAN}%s${RESET}\n" "$user_otp"
        ;;
    esac
  done
}
copy_args_to_cmd_publish "$@";

if $DRYRUN; then
  execute bunx npm pack -n
  echo "dryrun: ${cmd_publish[*]}";
  echo "tips:   provide a command line flag '--yes' for publishing";
else
  execute "${cmd_publish[@]}";
fi
