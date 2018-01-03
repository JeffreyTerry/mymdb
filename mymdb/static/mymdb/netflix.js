function isStreamingOnNetflix(movie, callback) {
    if (movieCache.hasOwnProperty(movie.imdbID) && movieCache[movie.imdbID].hasOwnProperty('netflix')) {
        if (callback)
            callback(movieCache[movie.imdbID]['netflix']);
    }
    $.get('/movies/streaming/' + htmlEncoded(movie.Title), function(data) {
        if (!movieCache.hasOwnProperty(movie.imdbID)) {
            movieCache[movie.imdbID] = {};
        }
        movieCache[movie.imdbID]['netflix'] = data.netflix;
        if (callback)
            callback(data.netflix);
    });
}
