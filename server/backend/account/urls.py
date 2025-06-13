from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    # path('', views.home, name='home'),
    path('create-upload/', views.create_upload),
    path('complete-upload/', views.complete_upload),
]
