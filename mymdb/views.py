from django.http import JsonResponse
from django.views.generic.base import TemplateView
from django.views.generic import View
from bs4 import BeautifulSoup
from imdb import IMDb
import requests


class IndexView(TemplateView):
    template_name = 'mymdb/index.html'


def getMovieData(imdb_data):
    MovieView.ia.update(imdb_data, 'main')
    MovieView.ia.update(imdb_data, 'plot')
    MovieView.ia.update(imdb_data, 'critic reviews')
    res = {}
    res['genres'] = imdb_data['genres']
    res['rating'] = imdb_data['rating']
    res['metascore'] = imdb_data['metascore']
    res['plot'] = imdb_data['plot outline']
    res['cover_url'] = imdb_data['cover url']
    res['title'] = imdb_data['title']
    res['runtimes'] = imdb_data['runtimes']
    res['director'] = imdb_data['director'][0]['name']
    # print imdb_data.keys()
    return JsonResponse(res)

class MovieView(View):
    ia = IMDb()

    def get(self, request, *args, **kwargs):
        if 'title' in kwargs:
            title = kwargs['title']

            if kwargs['recommendations']:
                if kwargs['recommendations'] == 'recommendations':
                    imdb_data = MovieView.ia.search_movie(title, results=1)[0]
                    src = requests.get('http://www.imdb.com/title/tt' + imdb_data.movieID + '/').text
                    bs = BeautifulSoup(src)
                    recs = [rec['data-tconst'][2:] for rec in bs.findAll('div', 'rec_item')]
                    res = {}
                    for i, rec in enumerate(recs):
                        res[i] = rec
                    return JsonResponse(res)
                else:
                    return JsonResponse({'err': 'bad url'})
            else:
                # Grab data from IMDb
                imdb_datas = MovieView.ia.search_movie(title, results=1)
                if imdb_datas:
                    imdb_data = imdb_datas[0]
                    return getMovieData(imdb_data)
                else:
                    return JsonResponse({'err': 'no data found in imdb'})

    def post(self, request, *args, **kwargs):
        return HttpResponse('This is POST request')


class MovieIdView(View):
    ia = IMDb()

    def get(self, request, *args, **kwargs):
        movieID = kwargs['id']

        # Grab data from IMDb
        imdb_data = MovieView.ia.get_movie(movieID)
        return getMovieData(imdb_data)

    def post(self, request, *args, **kwargs):
        return HttpResponse('This is POST request')
