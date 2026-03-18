import uuid
from django.db import models
from django.contrib.auth.models import User


class File(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=1024)
    storage_key = models.CharField(max_length=512, unique=True, blank=True)
    size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=128, blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='files', null=True)
    is_deleted = models.BooleanField(default=False)
    is_starred = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name