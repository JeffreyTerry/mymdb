from django.http import JsonResponse
from django.views.generic.base import TemplateView
from django.views.generic import View
from bs4 import BeautifulSoup
from imdb import IMDb
import requests
import string


class IndexView(TemplateView):
    template_name = 'mymdb/index.html'


def getMovieData(imdb_data):
    MovieView.ia.update(imdb_data, 'main')
    MovieView.ia.update(imdb_data, 'plot')
    MovieView.ia.update(imdb_data, 'critic reviews')
    res = {}
    try:
        res['genres'] = imdb_data['genres']
        res['plot'] = imdb_data['plot outline']
        res['cover_url'] = imdb_data['cover url']
        res['title'] = imdb_data['title']
        res['runtimes'] = imdb_data['runtimes']
        res['director'] = imdb_data['director'][0]['name']
        res['rating'] = imdb_data['rating']
        res['metascore'] = imdb_data['metascore']
    except KeyError:
        pass
    return JsonResponse(res)

class MovieView(View):
    ia = IMDb()

    def get(self, request, *args, **kwargs):
        try:
            src = requests.get('http://www.imdb.com/title/' + kwargs['id'] + '/').text
            bs = BeautifulSoup(src, 'lxml')

            ### PARSE TITLES AND IDS ###
            titles = [rec.a.b.string for rec in bs.findAll('div', 'rec-title')]
            ids = [rec['data-tconst'] for rec in bs.findAll('div', 'rec_overview')]

            ### PARSE GENRES ###
            genres_htmls = [rec for rec in bs.findAll('div', 'rec-cert-genre')]
            genres = []
            for g in genres_htmls:
                span = g.find('span', recursive=False)
                if span:
                    genres.append(span.next_sibling)
                else:
                    genres.append(g.string)
            genres = map(lambda g: string.strip(g), genres)

            ### PARSE RATINGS ###
            ratings_htmls = [rec for rec in bs.findAll('div', 'rec-rating')]
            ratings = []
            for rr in ratings_htmls:
                ratings.append(rr.find('span', 'rating-rating').span.string)

            results = []
            for i, (title, movie_id, genre, rating) in enumerate(zip(titles, ids, genres, ratings)):
                results.append({})
                results[i]['title'] = title
                results[i]['id'] = movie_id
                results[i]['genre'] = genre
                results[i]['rating'] = rating
            return JsonResponse(results, safe=False)
        except Exception as e:
            return JsonResponse({'err': 'could not parse recommendations from IMDb', 'exc': repr(e)})

    def post(self, request, *args, **kwargs):
        return HttpResponse('This is POST request')
