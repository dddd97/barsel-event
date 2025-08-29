#!/usr/bin/env bash
set -e

host="$1"
shift
cmd="$@"

until pg_isready -h "$host" -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "⏳ Waiting for Postgres ($host) ..."
  sleep 2
done

echo "✅ Postgres is ready!"
exec $cmd 