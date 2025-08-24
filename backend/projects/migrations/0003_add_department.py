from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0002_add_completion_days'),
    ]

    operations = [
        migrations.AddField(
            model_name='employee',
            name='department',
            field=models.CharField(
                choices=[
                    ('engineering', 'Engineering'),
                    ('design', 'Design'),
                    ('marketing', 'Marketing'),
                    ('sales', 'Sales'),
                    ('hr', 'Human Resources'),
                    ('finance', 'Finance'),
                    ('operations', 'Operations'),
                    ('other', 'Other'),
                ],
                default='other',
                max_length=20
            ),
        ),
    ]