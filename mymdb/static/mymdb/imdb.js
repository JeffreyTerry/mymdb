theMovieDb.common.api_key = "54cdd1b8e4773e1f8a532a519e766c79";

function getMovieFromImdb(id, callback) {
    if (movieCache.hasOwnProperty(id) && movieCache[id].hasOwnProperty('movie')) {
        if (callback)
            callback(null, movieCache[id]['movie']);
    } else {
        omdb.get({id: id}, function(err, data) {
            if (err) { 
                callback(err);
            } else {
                if (!movieCache.hasOwnProperty(data.imdbID)) {
                    movieCache[data.imdbID] = {};
                }
                movieCache[data.imdbID]['movie'] = data;
                if (callback)
                    callback(null, data);
            }
        });
    }
}

// This function should only be used when we need to search for a movie based on a user query.
// Its result is inexact.
function getMovieFromIMDbByTitle(titleQuery, callback) {
    theMovieDb.search.getMovie({"query": encodeURI(titleQuery), 'append_to_response': 'external_ids'}, function(data) {
        top_result = JSON.parse(data).results[0];
        theMovieDb.movies.getById({'id': top_result.id}, function(raw_movie_data) {
            raw_movie_data = JSON.parse(raw_movie_data);
            theMovieDb.movies.getCredits({'id': top_result.id}, function(credits_data) {
                credits_data = JSON.parse(credits_data);
                theMovieDb.movies.getTrailers({'id': top_result.id}, function(list_of_trailers) {
                    list_of_trailers = JSON.parse(list_of_trailers);
                    if (!list_of_trailers.results) {
                        list_of_trailers.results = [''];
                    }

                    // Create our movie object
                    var movie = {};
                    movie.Title = raw_movie_data.title;
                    movie.Director = credits_data.crew.find(function(element) {
                        if (element.job == 'Director')
                            return true;
                    }).name;
                    movie.Metascore = 'TODO';
                    movie.imdbRating = raw_movie_data.vote_average;
                    movie.Plot = raw_movie_data.overview;
                    movie.Year = raw_movie_data.release_date.substring(0, 4);
                    movie.imdbID = raw_movie_data.imdb_id;
                    movie.Genres = raw_movie_data.genres;
                    movie.Trailer = list_of_trailers.youtube.find(function(element) {
                        if (element.type == 'Trailer')
                            return true;
                    }).source;

                    getPosterURLBase(function(base_url) {
                        movie.Poster = base_url + raw_movie_data.poster_path;
                        // Do cache magic
                        if (!movieCache.hasOwnProperty(movie.imdbID)) {
                            movieCache[movie.imdbID] = {};
                        }
                        movieCache[movie.imdbID]['movie'] = movie;
                        if (callback)
                            callback(null, movie);
                    });
                }, function (err) {
                    if (callback)
                        callback(err);
                });
            }, function (err) {
                if (callback)
                    callback(err);
            });
        }, function(err) {
            if (callback)
                callback(err);
        });
    }, function(err) {
        if (callback)
            callback(err);
    });
}

function getRecommendationsFromImdb(id, callback) {
    if (movieCache.hasOwnProperty(id) && movieCache[id].hasOwnProperty('recommendations')) {
        if (callback)
            callback(null, movieCache[id]['recommendations']);
    } else {
        $.get('/movies/recommendations/' + htmlEncoded(id), function(data) {
            if (data.hasOwnProperty('err')) {
                if (callback)
                    callback(data);
            } else {
                if (!movieCache.hasOwnProperty(id)) {
                    movieCache[id] = {};
                }
                movieCache[id]['recommendations'] = data;
                if (callback)
                    callback(null, data);
            }
        });
    }
}

function getPosterURLBase(callback) {
    theMovieDb.configurations.getConfiguration(function(config) {
        config = JSON.parse(config);
        callback(config.images.base_url + config.images.poster_sizes[3]);
    }, function (err) {
        console.log('Error: Could not get poster URL base from theMovieDb config');
    });
}
