#!/bin/bash
# This script is an interface to any of the methods of lib.sh
# Call this script as "do.sh method_from_lib" to execute any function from that library
set -eu

HERE="$(
    cd "$(dirname "${BASH_SOURCE[0]}")"
    pwd -P
)"
# shellcheck disable=SC1090
source "${HERE}/lib.sh"

# This is to report issues to sentry-dev-env
# Do not report any issues if SENTRY_DEVENV_NO_REPORT is defined
# if [ -z "${SENTRY_DEVENV_NO_REPORT+x}" ]; then
#     if ! command -v "sentry-cli" >/dev/null 2>&1; then
#         curl -sL https://sentry.io/get-cli/ | bash
#     fi
#     echo "hey!"
#     # Do not set SENTRY_DSN if the user has already defined one
#     if [ -z "${SENTRY_DSN+x}" ]; then
#         # Report issues to sentry-dev-env
#         export SENTRY_DSN="https://9bdb053cb8274ea69231834d1edeec4c@o1.ingest.sentry.io/5723503"
#     fi
#     eval "$(sentry-cli bash-hook)"
# fi
configure-sentry-cli

# This guarantees that we're within a venv. A caller that is not within
# a venv can avoid enabling this by setting SENTRY_NO_VENV_CHECK
[ -z "${SENTRY_NO_VENV_CHECK+x}" ] && eval "${HERE}/ensure-venv.sh"
# If you call this script
# "$@"
# shellcheck disable=SC1090
# source "${HERE}/lib.sh" "$@"
echo "$@"
"${HERE}/lib.sh" develop
