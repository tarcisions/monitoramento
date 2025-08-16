from rest_framework import permissions
from django.contrib.auth.models import Group

class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        
        return (
            request.user.is_authenticated and 
            (request.user.is_superuser or 
             request.user.groups.filter(name='admin').exists())
        )

class IsOperadorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return (
            request.user.is_superuser or
            request.user.groups.filter(name__in=['admin', 'operador']).exists()
        )

class IsLeitorOrAbove(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        return (
            request.user.is_superuser or
            request.user.groups.filter(name__in=['admin', 'operador', 'leitor']).exists()
        )

class CanControlExecution(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        if view.action in ['list', 'retrieve']:
            return request.user.groups.filter(name__in=['admin', 'operador', 'leitor']).exists()
        
        return request.user.groups.filter(name__in=['admin', 'operador']).exists()

class TokenAgentAuthentication(permissions.BasePermission):
    def has_permission(self, request, view):
        token = request.META.get('HTTP_AUTHORIZATION')
        
        if not token:
            return False
        
        if not token.startswith('Bearer '):
            return False
        
        token_value = token[7:]
        
        from core.models import Robo
        try:
            robo = Robo.objects.get(token_agente=token_value, ativo=True)
            request.robo_agente = robo
            return True
        except Robo.DoesNotExist:
            return False
