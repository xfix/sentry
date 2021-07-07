# Generated by Django 1.11.29 on 2020-10-28 22:57
from django.db import migrations

from sentry.utils.query import RangeQuerySetWrapper


def backfill_snuba_query_event_type(apps, schema_editor):
    """
    This backfills all SnubaQuery rows that don't have a `SnubaQueryEventType`.
    """
    SnubaQuery = apps.get_model("sentry", "SnubaQuery")
    SnubaQueryEventType = apps.get_model("sentry", "SnubaQueryEventType")

    for snuba_query in RangeQuerySetWrapper(SnubaQuery.objects.all()):
        if not SnubaQueryEventType.objects.filter(snuba_query=snuba_query).exists():
            # 0 is SnubaQueryEventType.EventTypes.ERROR,
            # 2 is SnubaQueryEventType.EventTypes.TRANSACTION.
            SnubaQueryEventType.objects.create(
                snuba_query=snuba_query, type=(0 if snuba_query.dataset == "events" else 2)
            )


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
    atomic = False

    dependencies = [
        ("sentry", "0117_dummy-activityupdate"),
    ]

    operations = [
        migrations.RunPython(
            backfill_snuba_query_event_type,
            reverse_code=migrations.RunPython.noop,
            hints={"tables": ["sentry_snubaqueryeventtype"]},
        ),
    ]
