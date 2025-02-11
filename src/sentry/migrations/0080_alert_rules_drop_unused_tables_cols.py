# Generated by Django 1.11.29 on 2020-05-22 18:10

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
    is_dangerous = False

    # This flag is used to decide whether to run this migration in a transaction or not.
    # By default we prefer to run in a transaction, but for migrations where you want
    # to `CREATE INDEX CONCURRENTLY` this needs to be set to False. Typically you'll
    # want to create an index concurrently when adding one to an existing table.
    atomic = True

    dependencies = [("sentry", "0079_incidents_remove_query_field_state")]

    operations = [
        migrations.RunSQL(
            """
            DROP TABLE "sentry_alertruleenvironment";
            DROP TABLE "sentry_alertrulequerysubscription";
            DROP TABLE "sentry_querysubscriptionenvironment";
            DROP TABLE "sentry_incidentgroup";

            ALTER TABLE "sentry_alertrule"
            DROP COLUMN "aggregation",
            DROP COLUMN "dataset",
            DROP COLUMN "query",
            DROP COLUMN "resolution",
            DROP COLUMN "time_window";

            ALTER TABLE "sentry_querysubscription"
            DROP COLUMN "aggregation",
            DROP COLUMN "dataset",
            DROP COLUMN "query",
            DROP COLUMN "resolution";

            ALTER TABLE "sentry_incident"
            DROP COLUMN "aggregation",
            DROP COLUMN "query";
        """,
            reverse_sql="""
            CREATE TABLE "sentry_alertruleenvironment" (id bigint);
            CREATE TABLE "sentry_alertrulequerysubscription" (id bigint);
            CREATE TABLE "sentry_querysubscriptionenvironment" (id bigint);
            CREATE TABLE "sentry_incidentgroup" (id bigint);

            ALTER TABLE "sentry_alertrule"
                ADD COLUMN "aggregation" int,
                ADD COLUMN "dataset" int,
                ADD COLUMN "query" text,
                ADD COLUMN "resolution" text,
                ADD COLUMN "time_window" int;

            ALTER TABLE "sentry_querysubscription"
                ADD COLUMN "aggregation" int,
                ADD COLUMN "dataset" int,
                ADD COLUMN "query" text,
                ADD COLUMN "resolution" text;

            ALTER TABLE "sentry_incident"
                ADD COLUMN "aggregation" int,
                ADD COLUMN "query" text;

        """,
            hints={
                "tables": [
                    "sentry_incident",
                    "sentry_alertrule",
                    "sentry_querysubscription",
                    "sentry_alertruleenvironment",
                    "sentry_alertrulequerysubscription",
                    "sentry_querysubscriptionenvironment",
                    "sentry_incidentgroup",
                ]
            },
        )
    ]
