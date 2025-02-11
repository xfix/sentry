from django.db import migrations


class Migration(migrations.Migration):
    # This flag is used to mark that a migration shouldn't be automatically run in
    # production. We set this to True for operations that we think are risky and want
    # someone from ops to run manually and monitor.
    # General advice is that if in doubt, mark your migration as `is_dangerous`.
    # Some things you should always mark as dangerous:
    # - Adding indexes to large tables. These indexes should be created concurrently,
    #   unfortunately we can't run migrations outside of a transaction until Django
    #   1.10. So until then these should be run manually.
    # - Large data migrations. Typically we want these to be run manually by ops so that
    #   they can be monitored. Since data migrations will now hold a transaction open
    #   this is even more important.
    # - Adding columns to highly active tables, even ones that are NULL.
    is_dangerous = False

    dependencies = [("sentry", "0015_delete_sentryappwebhookerror_db")]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    """
                    ALTER TABLE "sentry_alertrule" DROP COLUMN "alert_threshold";
                    ALTER TABLE "sentry_alertrule" DROP COLUMN "resolve_threshold";
                    ALTER TABLE "sentry_alertrule" DROP COLUMN "threshold_type";
                    """,
                    reverse_sql="""
                    ALTER TABLE "sentry_alertrule" ADD COLUMN "alert_threshold" smallint NULL;
                    ALTER TABLE "sentry_alertrule" ADD COLUMN "resolve_threshold" int NULL;
                    ALTER TABLE "sentry_alertrule" ADD COLUMN "threshold_type" int NULL;

                    """,
                    hints={"tables": ["sentry_alertrule"]},
                )
            ],
            state_operations=[],
        )
    ]
