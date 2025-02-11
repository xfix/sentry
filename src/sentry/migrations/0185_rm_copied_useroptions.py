# Generated by Django 1.11.29 on 2021-04-07 21:30

from django.db import migrations

from sentry.utils.query import RangeQuerySetWrapperWithProgressBar


def delete_duplicate_useroption_rows(apps, schema_editor):
    """
    Delete the rows in UserOption that have already been copied over
    to the NotificationSetting table, also add a few unused ones while we're at it
    """
    UserOption = apps.get_model("sentry", "UserOption")
    for user_option in RangeQuerySetWrapperWithProgressBar(UserOption.objects.all()):
        if user_option.key in (
            "workflow:notifications",
            "mail:alert",
            "deploy-emails",
            "subscribe_by_default",
            "seen_release_broadcast",
            "twilio:alert",
            "workflow_notification",
        ):
            user_option.delete()


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
        ("sentry", "0184_copy_useroptions_to_notificationsettings_2"),
    ]
    operations = [
        migrations.RunPython(
            code=delete_duplicate_useroption_rows,
            reverse_code=migrations.RunPython.noop,
            hints={"tables": ["sentry_useroption"]},
        )
    ]
