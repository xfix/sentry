# Generated by Django 1.11.29 on 2021-03-15 14:56
from datetime import datetime

import pytz
from django.db import migrations

from sentry.utils.query import RangeQuerySetWrapperWithProgressBar

LEGACY_DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S%z"
DATETIME_FORMAT = "%Y-%m-%dT%H:%M:%S.%fZ"


def update_legacy_discover_saved_query_timestamps(apps, schema_editor):
    DiscoverSavedQuery = apps.get_model("sentry", "DiscoverSavedQuery")

    for saved_query in RangeQuerySetWrapperWithProgressBar(DiscoverSavedQuery.objects.all()):
        query = saved_query.query
        updated = False
        for key in ["start", "end"]:
            if key not in query:
                continue

            value = query[key]
            try:
                parsed = datetime.strptime(value, LEGACY_DATETIME_FORMAT).astimezone(pytz.utc)
            except ValueError:
                pass
            else:
                value = datetime.strftime(parsed, DATETIME_FORMAT)
                query[key] = value
                updated = True

        if updated:
            saved_query.query = query
            saved_query.save()


class Migration(migrations.Migration):
    # This flag is used to mark that a migration shouldn't be automatically run in
    # production. We set this to True for operations that we think are risky and want
    # someone from ops to run manually and monitor.
    # General advice is that if in doubt, mark your migration as `is_dangerous`.
    # Some things you should always mark as dangerous:
    # - Large data migrations. Typically we want these to be run manually by ops so that
    #   they can be monitored. Since data migrations will now hold a transaction open
    #   this is even more important.
    # - Adding columns to highly active tables, even ones that are NULL.
    is_dangerous = False

    # This flag is used to decide whether to run this migration in a transaction or not.
    # By default we prefer to run in a transaction, but for migrations where you want
    # to `CREATE INDEX CONCURRENTLY` this needs to be set to False. Typically you'll
    # want to create an index concurrently when adding one to an existing table.
    # You'll also usually want to set this to `False` if you're writing a data
    # migration, since we don't want the entire migration to run in one long-running
    # transaction.
    atomic = False

    dependencies = [
        ("sentry", "0178_add_new_target_column"),
    ]

    operations = [
        migrations.RunPython(
            update_legacy_discover_saved_query_timestamps,
            reverse_code=migrations.RunPython.noop,
            hints={"tables": ["sentry_discoversavedquery"]},
        )
    ]
