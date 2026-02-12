# Data migration: create default RBAC roles

from django.db import migrations


def create_default_roles(apps, schema_editor):
    Role = apps.get_model("users", "Role")
    Role.objects.get_or_create(
        name="Administrator",
        defaults={
            "permissions": [
                "reports.view", "reports.edit", "reports.delete",
                "dashboards.view", "dashboards.edit", "dashboards.delete",
                "data_sources.view", "data_sources.edit", "data_sources.delete",
                "users.view", "users.edit", "users.delete",
            ],
        },
    )
    Role.objects.get_or_create(
        name="Editor",
        defaults={
            "permissions": [
                "reports.view", "reports.edit",
                "dashboards.view", "dashboards.edit",
                "data_sources.view", "data_sources.edit",
            ],
        },
    )
    Role.objects.get_or_create(
        name="Viewer",
        defaults={
            "permissions": [
                "reports.view",
                "dashboards.view",
                "data_sources.view",
            ],
        },
    )


def reverse_default_roles(apps, schema_editor):
    Role = apps.get_model("users", "Role")
    Role.objects.filter(name__in=["Administrator", "Editor", "Viewer"]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0002_add_role_and_rbac"),
    ]

    operations = [
        migrations.RunPython(create_default_roles, reverse_default_roles),
    ]
