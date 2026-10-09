from rest_framework import viewsets, serializers
from .models import BusinessPartner

class BusinessPartnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessPartner
        fields = ['id', 'name', 'partner_type', 'email', 'phone', 'payment_terms_days']

class BusinessPartnerViewSet(viewsets.ModelViewSet):
    queryset = BusinessPartner.objects.all().order_by('name')
    serializer_class = BusinessPartnerSerializer
