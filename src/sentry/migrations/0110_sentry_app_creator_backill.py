# Generated by Django 1.11.29 on 2020-10-06 17:57

from django.db import migrations


def backfill_one(sentry_app, AuditLogEntry):
    queryset = AuditLogEntry.objects.filter(
        organization_id=sentry_app.owner_id, actor_id__isnull=False, event=113
    )  # sentry app add

    for audit_log_entry in queryset:
        name = audit_log_entry.data.get("sentry_app")
        # find a name match based on the name
        if name and name == sentry_app.name:
            user = audit_log_entry.actor
            sentry_app.creator_user = user
            sentry_app.creator_label = user.email or user.username
            sentry_app.save()
            return


def backfill_sentry_app_creator(apps, schema_editor):
    """
    Backills the creator fields of SentryApp from
    the audit log table
    """
    SentryApp = apps.get_model("sentry", "SentryApp")
    AuditLogEntry = apps.get_model("sentry", "AuditLogEntry")

    queryset = SentryApp.objects.filter(date_deleted__isnull=True, creator_user_id__isnull=True)

    for sentry_app in queryset:
        backfill_one(sentry_app, AuditLogEntry)


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
    atomic = False

    dependencies = [
        ("sentry", "0109_sentry_app_creator"),
    ]

    operations = [
        migrations.RunPython(
            backfill_sentry_app_creator,
            reverse_code=migrations.RunPython.noop,
            hints={"tables": ["sentry_auditlogentry"]},
        ),
    ]
