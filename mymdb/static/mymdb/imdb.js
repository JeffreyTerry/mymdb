
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
// Its result is often counterintuitive.
function getMovieFromIMDbByTitle(titleQuery, callback) {
    omdb.get({title: titleQuery, type: 'movie'}, function(err, data) {
        if (err) {
            if (callback)
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
