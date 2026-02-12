"""
Assign the Administrator role to a user so they are admin in both Django admin and the frontend.
Usage: python manage.py assign_admin_role [username]
Default username: htevilili
"""
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from users.models import Role, UserProfile

User = get_user_model()


class Command(BaseCommand):
    help = "Assign the Administrator role to a user (backend + frontend admin)."

    def add_arguments(self, parser):
        parser.add_argument(
            "username",
            nargs="?",
            default="htevilili",
            help="Username to make administrator (default: htevilili)",
        )

    def handle(self, *args, **options):
        username = options["username"]
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"User '{username}' does not exist."))
            return

        try:
            role = Role.objects.get(name="Administrator")
        except Role.DoesNotExist:
            self.stderr.write(
                self.style.ERROR("Role 'Administrator' not found. Run migrations.")
            )
            return

        profile, created = UserProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"User '{username}' is now an Administrator (backend + frontend admin)."
            )
        )
