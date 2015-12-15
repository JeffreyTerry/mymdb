
// constants
var standardRadius = 22;
var width = window.innerWidth * 0.65;
var height = window.innerHeight - 45;

//Set up the colour scale
// var color = d3.scale.category20();
var customColorRange = colorbrewer.RdYlGn[11].slice(0, 5);
Array.prototype.push.apply(customColorRange, colorbrewer.RdYlGn[11].slice(6));
var color = d3.scale.ordinal()
                .domain([4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10])
                .range(customColorRange);

function roundToNearestHalf(x) {
    return Math.round(x * 2) / 2;
}

function nodeInnerFillFunction(d) {
    return color(Math.max(4.5, roundToNearestHalf(d.rating)));
}

function nodeOuterFillFunction(d) {
    if (d.rating > 7.5)
        return shadeColor(nodeInnerFillFunction(d), 50);
    else
        return shadeColor(nodeInnerFillFunction(d), -30);
}

function mouseenter() {
    // If we haven't already appended the outer circle
    var secondaryCircle = d3.select(this)
        .insert("circle", ':first-child')
        .attr('class', 'secondary')
        .attr("fill", nodeOuterFillFunction)
        .attr("r", standardRadius)
        .transition()
        .duration(50)
        .attr("r", standardRadius * 1.4);
    $(this).first().click(clickMovieNode);
}

function mouseleave() {
    d3.select(this).selectAll("circle.secondary")
        .transition()
        .duration(50)
        .attr("r", standardRadius)
        .remove();
}

// function mouseover() {
//   d3.select(this).select("circle").transition()
//       .duration(250)
//       .attr("r", standardRadius * 1.3);
// }

// function mouseout() {
//   d3.select(this).select("circle").transition()
//       .duration(250)
//       .attr("r", standardRadius);
// }

// function genre_to_color(genre) {
//     if (genre == "Action") {
//         return 0;
//     }
//     if (genre == "Animation") {
//         return 1;
//     }
//     if (genre == "Comedy") {
//         return 2;
//     }
//     if (genre == "Documentary") {
//         return 3;
//     }
//     if (genre == "Family") {
//         return 4;
//     }
//     if (genre == "Horror") {
//         return 6;
//     }
//     if (genre == "Musical") {
//         return 7;
//     }
//     if (genre == "Romance") {
//         return 8;
//     }
//     if (genre == "Sport") {
//         return 9;
//     }
//     if (genre == "War") {
//         return 10;
//     }
//     if (genre == "Adventure") {
//         return 11;
//     }
//     if (genre == "Crime") {
//         return 13;
//     }
//     if (genre == "Drama") {
//         return 14;
//     }
//     if (genre == "Fantasy") {
//         return 15;
//     }
//     if (genre == "History") {
//         return 16;
//     }
//     if (genre == "Music") {
//         return 17;
//     }
//     if (genre == "Mystery") {
//         return 18;
//     }
//     if (genre == "Sci-Fi") {
//         return 19;
//     }
//     if (genre == "Thriller") {
//         return 12;
//     }
//     if (genre == "Western") {
//         return 5;
//     }
// }

// ------------------------------------------------------------------- start logic
graph = new MyMDbGraph("#graph");

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

function putMovieInSidebar(movie) {
    $("#sb-title").text(movie.Title);
    $("#sb-director").text("By: " + movie.Director);
    $("#sb-metacritic-rating").text("Metacritic: " + movie.Metascore);
    $("#sb-imdb-rating").html('<a href="http://www.imdb.com/title/' + movie.imdbID
         + '">IMDb: ' + movie.imdbRating + '</a>');
    $("#sb-plot").text(movie.Plot);
    $("#sb-photo").html('<img src="' + movie.Poster + '">');
    loadYoutubeTrailer(movie.Title, movie.Year);
}

function expandMovieNode(id, successCallback) {
    // Trim the graph
    if (!movieHistorySet.has(id)) {
        movieHistoryQueue.push(id);
        movieHistorySet.add(id);
        if (movieHistoryQueue.length > 5) {
            movieToRemove = movieHistoryQueue.shift();
            movieHistorySet.delete(movieToRemove);
            graph.removeNode(movieToRemove);
        }
    }

    if (!expandedNodes.has(id)) {
        expandedNodes.add(id);
        getRecommendationsFromImdb(id, function(err, movies) {
            if (err) {
                console.log('Error: ', err);
            } else {
                console.log(movies)
                movies = _.reject(movies, function(movie) {
                    return existingNodes.has(movie.id);
                });
                movies = _.sample(movies, 3);
                for (var i = 0; i < movies.length; ++i) {
                    // Add the recommended movies to the graph
                    var movie = movies[i];
                    graph.addNode(movie['title'], movie['id'],
                        movie['genre'], movie['rating']);
                    graph.addLink(id, movie['id']);

                    // Cache recommendations for the movies we just added to the graph
                    getRecommendationsFromImdb(movie['id']);
                }
                // Unbind and rebind the click callback to ALL nodes
                $("circle").unbind("click");
                $("circle").click(clickMovieNode);
                // graph.fixNodePosition(id);
                if (successCallback)
                    successCallback();
            }
        });
    }
}

var activeMovieID = '';
function clickMovieNode(event) {
    var $target = $(event.target);
    if ($target.attr('clicked') !== 'true') {
        $target.attr('clicked', 'true');
        var title = $target.parent().attr('movie-title');
        var id = $target.parent().attr('movie-id');
        if ($target.attr('class') === 'primary') {
            clearSidebar();
            $("#sb-title").text(title);
            showSidebarSpinner();
            activeMovieID = id;
            getMovieFromImdb(id, function(err, movie) {
                console.log(err, movie);
                if (err) {
                    alert('Error: ', err);
                } else if (movie.imdbID === activeMovieID) {
                    hideSidebarSpinner();
                    putMovieInSidebar(movie);
                }
                $target.attr('clicked', 'false');
            });
        } else if ($target.attr('class') === 'secondary') {
            expandMovieNode(id, function() {
                $target.attr('clicked', 'false');
            });
        }
    }
}

function initializeInitialInputBox() {
    $("#initial-input-box").keyup(function(event) {
        if (event.keyCode == 13) {
            var inputTitle = document.getElementById("initial-input-box").value;
            $("#initial-input-box").hide();
            showSidebarSpinner()
            getMovieFromIMDbByTitle(inputTitle, function(err, movie) {
                hideSidebarSpinner();
                if (err) {
                    $("#initial-input-box").show();
                } else {
                    $("#initial-input-box").remove();
                }
                graph.addNode(movie.Title, movie.imdbID, movie.Genre.split(', ')[0], movie.imdbRating);
                expandMovieNode(movie.imdbID);
                putMovieInSidebar(movie);
            });
        }
    });
}

function clearSidebar() {
    $("#sb-title").text('');
    $("#sb-director").text('');
    $("#sb-metacritic-rating").text('');
    $("#sb-imdb-rating").text('');
    $("#sb-plot").text('');
    $("#sb-photo").html('');
    $("#video").html('');
}

function showSidebarSpinner() {
    $("#sb-loader-container").css('display', 'block');
}

function hideSidebarSpinner() {
    $("#sb-loader-container").css('display', 'none');
}

initializeInitialInputBox();
