import os
import sys
sys.path.append('~/mymdb/')
#sys.path.append('/home/ubuntu/.local/lib/python2.7/site-packages')
os.environ['DJANGO_SETTINGS_MODULE'] = 'mymdb.settings'
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
