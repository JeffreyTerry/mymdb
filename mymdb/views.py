from django.http import HttpResponse
from django.views.generic.base import TemplateView


class IndexView(TemplateView):
    template_name = 'mymdb/index.html'
