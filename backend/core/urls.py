from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from apps.manufacturing.views import WorkOrderViewSet
from apps.inventory.views import ItemViewSet, StockLedgerViewSet, DashboardAnalyticsView
from apps.sales.views import SalesOrderViewSet
from apps.procurement.views import PurchaseOrderViewSet
from apps.engineering.views import BOMViewSet
from apps.partners.views import BusinessPartnerViewSet

router = DefaultRouter()
router.register(r'work-orders', WorkOrderViewSet, basename='work-order')
router.register(r'inventory', ItemViewSet, basename='inventory')
router.register(r'stock-ledger', StockLedgerViewSet, basename='stock-ledger')
router.register(r'sales-orders', SalesOrderViewSet, basename='sales-order')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-order')
router.register(r'boms', BOMViewSet, basename='bom')
router.register(r'partners', BusinessPartnerViewSet, basename='partner')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/analytics/dashboard/', DashboardAnalyticsView.as_view(), name='dashboard_analytics'),
    path('api/', include(router.urls)),
]
