# Generated by Django 1.11.29 on 2021-03-05 18:22

from django.db import migrations

from sentry.utils.query import RangeQuerySetWrapperWithProgressBar


def backfill_null_actors(apps, schema_editor):
    User = apps.get_model("sentry", "User")
    Team = apps.get_model("sentry", "Team")
    Actor = apps.get_model("sentry", "Actor")
    for user in RangeQuerySetWrapperWithProgressBar(User.objects.all()):
        if user.actor_id is None:
            user.actor_id = Actor.objects.create(type=1).id
            user.save()

    for team in RangeQuerySetWrapperWithProgressBar(Team.objects.all()):
        if team.actor_id is None:
            team.actor_id = Actor.objects.create(type=0).id
            team.save()


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
    is_dangerous = True

    # This flag is used to decide whether to run this migration in a transaction or not.
    # By default we prefer to run in a transaction, but for migrations where you want
    # to `CREATE INDEX CONCURRENTLY` this needs to be set to False. Typically you'll
    # want to create an index concurrently when adding one to an existing table.
    # You'll also usually want to set this to `False` if you're writing a data
    # migration, since we don't want the entire migration to run in one long-running
    # transaction.
    atomic = False

    dependencies = [
        ("sentry", "0170_actor_introduction"),
    ]

    operations = [
        migrations.RunPython(
            backfill_null_actors,
            reverse_code=migrations.RunPython.noop,
            hints={"tables": ["sentry_user", "sentry_team", "sentry_actor"]},
        )
    ]
