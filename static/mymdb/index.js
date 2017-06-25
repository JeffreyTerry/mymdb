graph = new MyMDbGraph("#graph");

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
                if (err) {
                    alert('Error: ', err);
                } else if (movie.imdbID === activeMovieID) {
                    hideSidebarSpinner();
                    putMovieInSidebar(movie);
                }
                setTimeout(function() {
                    $target.attr('clicked', 'false');
                }, 500);
            });
        } else if ($target.attr('class') === 'secondary') {
            expandMovieNode(id, function() {
                $target.attr('clicked', 'false');
            });
        }
    }
}

function putMovieInSidebar(movie) {
    $("#sb-title").text(movie.Title);
    $("#sb-director").text("By: " + movie.Director);
    $("#sb-metacritic-rating").html("Metacritic:&nbsp;" + movie.Metascore);
    $("#sb-imdb-rating").html('<a href="http://www.imdb.com/title/' + movie.imdbID
         + '">IMDb:&nbsp;' + movie.imdbRating + '</a>');
    $("#sb-plot").text(movie.Plot);
    $("#sb-photo").html('<img src="' + movie.Poster + '">');
    isStreamingOnNetflix(movie, function(result) {
        var $netflix = $("#netflix-icon");
        var src = $netflix.attr('src');
        src = src.substring(0, src.lastIndexOf('_'));
        if (result === false) {
            $netflix.attr('src', src + '_no.png');
        } else if (result === true) {
            $netflix.attr('src', src + '_yes.png');
        } else {
            $netflix.attr('src', src + '_maybe.png');
        }
        $("#sb-netflix").css({'display': 'block'});
    });
    loadYoutubeTrailer(movie.Title, movie.Year);
}

function clearSidebar() {
    $("#sb-title").text('');
    $("#sb-director").text('');
    $("#sb-metacritic-rating").text('');
    $("#sb-imdb-rating").text('');
    $("#sb-plot").text('');
    $("#sb-photo").html('');
    $("#sb-netflix").css({'display': 'none'});
    $("#video").html('');
}

function showSidebarSpinner() {
    $("#sb-loader-container").css('display', 'block');
}

function hideSidebarSpinner() {
    $("#sb-loader-container").css('display', 'none');
}

function initializeVideoToggle() {
    $("#toggle-video-button").click(function() {
        if ($("#sb-trailer > #video").height() == 0) {
            $("#sb-trailer").animate({'height': '260px'});
            $("#sb-trailer > #video").animate({'height': '100%'});
        } else {
            $("#sb-trailer").animate({'height': '40px'});
            $("#sb-trailer > #video").animate({'height': '0'});
        }
        $("#toggle-video-button > #toggle-up").toggleClass('nodisplay');
        $("#toggle-video-button > #toggle-down").toggleClass('nodisplay');
    });
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
                console.log(movie);
                graph.addNode(movie.Title, movie.imdbID, movie.Genre.split(', ')[0], movie.imdbRating);
                expandMovieNode(movie.imdbID);
                putMovieInSidebar(movie);
            });
        }
    });
}

initializeVideoToggle();
initializeInitialInputBox();
