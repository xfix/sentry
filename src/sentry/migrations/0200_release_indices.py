# Generated by Django 1.11.29 on 2021-05-27 17:16
from django.db import migrations


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
        ("sentry", "0199_release_semver"),
    ]
    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    """
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS "sentry_release_organization_id_status_3c637259_idx" ON "sentry_release" ("organization_id", "status");
                    """,
                    reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS sentry_release_organization_id_status_3c637259_idx",
                    hints={"tables": ["sentry_release"]},
                ),
                migrations.RunSQL(
                    """
                    CREATE INDEX CONCURRENTLY IF NOT EXISTS "sentry_release_organization_id_date_added_8ebd273a_idx" ON "sentry_release" ("organization_id", "date_added");
                    """,
                    reverse_sql="DROP INDEX CONCURRENTLY IF EXISTS sentry_release_organization_id_date_added_8ebd273a_idx",
                    hints={"tables": ["sentry_release"]},
                ),
            ],
            state_operations=[
                migrations.AlterIndexTogether(
                    name="release",
                    index_together={
                        ("organization", "build_code"),
                        ("organization", "major", "minor", "patch", "revision"),
                        ("organization", "build_number"),
                        ("organization", "status"),
                        ("organization", "date_added"),
                    },
                ),
            ],
        ),
    ]
