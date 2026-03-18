import uuid
import mimetypes
import os
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from django.http import FileResponse, Http404
from django.db.models import Sum
from .models import File


class FileViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        files = File.objects.filter(owner=request.user, is_deleted=False)
        data = [{
            'id': str(f.id),
            'name': f.name,
            'size': f.size,
            'mime_type': f.mime_type,
            'is_starred': f.is_starred,
            'created_at': f.created_at.isoformat(),
            'storage_key': f.storage_key,
            'thumbnail_url': request.build_absolute_uri(f'/media/{f.storage_key}')
                if f.mime_type and f.mime_type.startswith('image/') else None,
        } for f in files]
        return Response(data)

    def create(self, request):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'Файл не передан'}, status=400)

        # Проверка квоты 5 ГБ
        QUOTA = 5 * 1024 ** 3
        used = File.objects.filter(
            owner=request.user, is_deleted=False
        ).aggregate(total=Sum('size'))['total'] or 0

        if used + file_obj.size > QUOTA:
            return Response(
                {'error': f'Превышена квота! Доступно: {round((QUOTA - used) / 1024**2, 1)} МБ'},
                status=400
            )

        ext = os.path.splitext(file_obj.name)[1].lower()
        storage_key = f"uploads/{uuid.uuid4().hex}{ext}"
        default_storage.save(storage_key, ContentFile(file_obj.read()))

        mime_type = mimetypes.guess_type(file_obj.name)[0] or 'application/octet-stream'

        file = File.objects.create(
            name=file_obj.name,
            storage_key=storage_key,
            size=file_obj.size,
            mime_type=mime_type,
            owner=request.user,
        )
        return Response({
            'id': str(file.id),
            'name': file.name,
            'size': file.size,
            'mime_type': file.mime_type,
            'is_starred': file.is_starred,
            'created_at': file.created_at.isoformat(),
            'storage_key': file.storage_key,
        }, status=201)

    def partial_update(self, request, pk=None):
        try:
            file = File.objects.get(id=pk, owner=request.user)
            if 'name' in request.data:
                file.name = request.data['name']
            if 'is_starred' in request.data:
                file.is_starred = request.data['is_starred']
            file.save()
            return Response({'id': str(file.id), 'name': file.name, 'is_starred': file.is_starred})
        except File.DoesNotExist:
            return Response(status=404)

    def destroy(self, request, pk=None):
        try:
            file = File.objects.get(id=pk, owner=request.user)
            file.is_deleted = True
            file.save()
            return Response(status=204)
        except File.DoesNotExist:
            return Response(status=404)

    @action(detail=True, methods=['get'], url_path='download')
    def download(self, request, pk=None):
        try:
            file = File.objects.get(id=pk, owner=request.user)
            file_path = os.path.join(settings.MEDIA_ROOT, file.storage_key)
            if not os.path.exists(file_path):
                raise Http404
            response = FileResponse(
                open(file_path, 'rb'),
                content_type=file.mime_type or 'application/octet-stream'
            )
            response['Content-Disposition'] = f'attachment; filename="{file.name}"'
            return response
        except File.DoesNotExist:
            raise Http404