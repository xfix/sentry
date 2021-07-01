# Generated by Django 1.11.29 on 2020-04-20 20:53

import logging

from django.db import migrations, transaction

from sentry.utils.query import RangeQuerySetWrapperWithProgressBar

mail_action = {
    "id": "sentry.mail.actions.NotifyEmailAction",
    "targetType": "IssueOwners",
    "targetIdentifier": "None",
}


def set_user_option(UserOption, user, key, value, project):
    inst, created = UserOption.objects.get_or_create(
        user=user, project=project, key=key, defaults={"value": value}
    )
    if not created and inst.value != value:
        inst.update(value=value)


def migrate_project_to_issue_alert_targeting(project, ProjectOption, Rule, User, UserOption):
    if project.flags.has_issue_alerts_targeting:
        # Migration has already been run.
        return
    with transaction.atomic():
        # Determine whether this project actually has mail enabled
        try:
            mail_enabled = ProjectOption.objects.get(project=project, key="mail:enabled").value
        except ProjectOption.DoesNotExist:
            mail_enabled = True
        for rule in Rule.objects.filter(project=project, status=0):
            migrate_legacy_rule(rule, mail_enabled)

        if not mail_enabled:
            # If mail disabled, then we want to disable mail options for all
            # users associated with this project so that they don't suddenly start
            # getting mail via the `MailAdapter`, since it will always be enabled.
            for user in User.objects.filter(
                sentry_orgmember_set__teams__in=project.teams.all(), is_active=True
            ):
                set_user_option(UserOption, user, "mail:alert", 0, project)
                set_user_option(UserOption, user, "workflow:notifications", "2", project=project)

        # This marks the migration finished and shows the new UI
        project.flags.has_issue_alerts_targeting = True
        project.save()


def migrate_legacy_rule(rule, mail_enabled):
    actions = rule.data.get("actions", [])
    new_actions = []
    has_mail_action = False
    for action in actions:
        action_id = action.get("id")
        if action_id == "sentry.rules.actions.notify_event.NotifyEventAction":
            # This is the "Send a notification (for all legacy integrations)" action.
            # When this action exists, we want to add the new `NotifyEmailAction` action
            # to the rule. We'll still leave `NotifyEventAction` in place, since it will
            # only notify non-mail plugins once we've migrated.
            new_actions.append(action)
            has_mail_action = True
        elif (
            action_id == "sentry.rules.actions.notify_event_service.NotifyEventServiceAction"
            and action.get("service") == "mail"
        ):
            # This is the "Send a notification via mail" action. When this action
            # exists, we want to add the new `NotifyEmailAction` action to the rule.
            # We'll drop this action from the rule, since all it does it send mail and
            # we don't want to double up.
            has_mail_action = True
        else:
            new_actions.append(action)

    # We only add the new action if the mail plugin is actually enabled, and there's an
    # action that sends by mail. We do this outside the loop to ensure we don't add it
    # more than once.
    if mail_enabled and has_mail_action:
        new_actions.append(mail_action)

    if actions != new_actions:
        rule.data["actions"] = new_actions
        rule.save()


def migrate_to_issue_alert_targeting(apps, schema_editor):
    Project = apps.get_model("sentry", "Project")
    ProjectOption = apps.get_model("sentry", "ProjectOption")
    Organization = apps.get_model("sentry", "Organization")
    Rule = apps.get_model("sentry", "Rule")
    User = apps.get_model("sentry", "User")
    UserOption = apps.get_model("sentry", "UserOption")

    for org in RangeQuerySetWrapperWithProgressBar(Organization.objects.filter(status=0)):
        # We migrate a project at a time, but we prefer to group by org so that for the
        # most part an org will see the changes all at once.
        for project in Project.objects.filter(organization=org, status=0):
            try:
                migrate_project_to_issue_alert_targeting(
                    project, ProjectOption, Rule, User, UserOption
                )
            except Exception:
                # If a project fails we'll just log and continue. We shouldn't see any
                # failures, but if we do we can analyze them and re-run this migration,
                # since it is idempotent.
                logging.exception(f"Error migrating project {project.id}")


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

    dependencies = [("sentry", "0066_alertrule_manager")]

    operations = [
        migrations.RunPython(
            migrate_to_issue_alert_targeting,
            reverse_code=migrations.RunPython.noop,
            hints={"tables": ["sentry_useroption", "sentry_rule", "sentry_project"]},
        )
    ]
