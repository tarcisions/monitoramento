from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        token['nome_usuario'] = user.username
        token['email'] = user.email
        token['eh_admin'] = user.is_superuser
        
        grupos = list(user.groups.values_list('name', flat=True))
        token['grupos'] = grupos
        
        return token

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
