# Generated by Django 1.11.29 on 2020-10-14 14:21

from django.db import migrations


def add_unhandled_search(apps, schema_editor):
    SavedSearch = apps.get_model("sentry", "SavedSearch")
    search = SavedSearch.objects.create(
        name="Unhandled Errors",
        query="is:unresolved error.unhandled:true",
        organization_id=None,
        is_default=False,
        is_global=True,
        # models.search_common.SearchType.ISSUE
        type=0,
    )
    search.save()


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

    dependencies = [
        ("sentry", "0113_add_repositoryprojectpathconfig"),
    ]

    migrations.RunPython(
        code=add_unhandled_search,
        reverse_code=migrations.RunPython.noop,
        hints={"tables": ["sentry_savedsearch"]},
    )
