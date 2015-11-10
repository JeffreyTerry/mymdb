
// constants
var standardRadius = 20;
var width = window.innerWidth * 0.65;
var height = window.innerHeight - 45;

//Set up the colour scale
var color = d3.scale.category20();


function mouseover() {
  d3.select(this).select("circle").transition()
      .duration(250)
      .attr("r", standardRadius * 1.3);
}

function mouseout() {
  d3.select(this).select("circle").transition()
      .duration(250)
      .attr("r", standardRadius);
}

function genre_to_color(genre) {
    if (genre == "Action") {
        return 0;
    }
    if (genre == "Animation") {
        return 1;
    }
    if (genre == "Comedy") {
        return 2;
    }
    if (genre == "Documentary") {
        return 3;
    }
    if (genre == "Family") {
        return 4;
    }
    if (genre == "Horror") {
        return 6;
    }
    if (genre == "Musical") {
        return 7;
    }
    if (genre == "Romance") {
        return 8;
    }
    if (genre == "Sport") {
        return 9;
    }
    if (genre == "War") {
        return 10;
    }
    if (genre == "Adventure") {
        return 11;
    }
    if (genre == "Crime") {
        return 13;
    }
    if (genre == "Drama") {
        return 14;
    }
    if (genre == "Fantasy") {
        return 15;
    }
    if (genre == "History") {
        return 16;
    }
    if (genre == "Music") {
        return 17;
    }
    if (genre == "Mystery") {
        return 18;
    }
    if (genre == "Sci-Fi") {
        return 19;
    }
    if (genre == "Thriller") {
        return 12;
    }
    if (genre == "Western") {
        return 5;
    }
}

// ------------------------------------------------------------------- start logic
var seen = new Set();
var node_seen = new Set();

function myGraph(el) {

    // Add and remove elements on the graph object
    this.addNode = function (title, genre, rating) {
        if (!node_seen.has(title)) {
            nodes.push({"title":title,"genre":genre, "rating": rating});
            update();
            node_seen.add(title)
        }
    }

    this.removeNode = function (title) {
        var i = 0;
        var n = findNode(title);
        while (i < links.length) {
            if ((links[i]['source'] === n)||(links[i]['target'] == n)) links.splice(i,1);
            else i++;
        }
        var index = findNodeIndex(title);
        if(index !== undefined) {
            nodes.splice(index, 1);
            update();
        }
    }

    this.addLink = function (sourceTitle, targetTitle) {
        var sourceNode = findNode(sourceTitle);
        var targetNode = findNode(targetTitle);

        if((sourceNode !== undefined) && (targetNode !== undefined)) {

            if (!seen.has(targetNode.title)) {
                links.push({"source": sourceNode, "target": targetNode});
                seen.add(targetNode.title);
                update();
            }
        }
    }

    var findNode = function (title) {
        for (var i=0; i < nodes.length; i++) {
            if (nodes[i].title === title)
                return nodes[i]
        };
    }

    var findNodeIndex = function (title) {
        for (var i=0; i < nodes.length; i++) {
            if (nodes[i].title === title)
                return i
        };
    }

    // set up the D3 visualisation in the specified element
    var vis = this.vis = d3.select(el).append("svg:svg")
        .attr("width", width)
        .attr("height", height);

    var force = d3.layout.force()
        .gravity(.2)
        .distance(30)
        .charge(-2000)
        .size([width, height]);

    var nodes = force.nodes(),
        links = force.links();

    var update = function () {

        var link = vis.selectAll("line.link")
            .data(links, function(d) { return d.source.title + "-" + d.target.title; });

        link.enter().insert("line")
            .attr("class", "link");

        link.exit().remove();

        var node = vis.selectAll("g.node")
            .data(nodes, function(d) { return d.title;});


        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .style("fill", function (d) {
                var col = genre_to_color(d.genre)
                return color(col);
            })
            .on("mouseover", mouseover)
            .on("mouseout", mouseout)
            .call(force.drag);

        nodeEnter.append("circle")
            .attr("r", function (d) {
                return standardRadius;
            })
            

        nodeEnter.append("text")
            .attr("dx", 23)
            .attr("dy", ".35em")
            .text(function (d) {return d.title})

        node.exit().remove();

        force.on("tick", function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        });

        // Restart the force layout.
        force.start();
    }

    // Make it all go
    update();
}

graph = new myGraph("#graph");

function getMovieFromImdb(title, successCallback) {
    $.get('/movies/title/' + htmlEncoded(title), function(data) {
        if (data.err) {
            // TODO error handling
            console.log('err', data);
        } else {
            successCallback(data);
        }
    });
}

function putMovieInSidebar(movie) {
    $("#sb-title").text(movie.title);
    $("#sb-director").text("By: " + movie.director);
    $("#sb-metacritic-rating").text("Metacritic: " + movie.metascore);
    $("#sb-imdb-rating").text("IMDb: " + movie.rating);
    $("#sb-plot").text(movie.plot);
    $("#sb-photo").html('<img src="' + movie.cover_url + '"></div>');
}

function expandMovieNode(title) {
    $.get('/movies/title/' + htmlEncoded(title) + '/recommendations', function (data) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                graph.addNode(data[key][0], data[key][1], data[key][2]);
                graph.addLink(title, data[key][0]);
            }
        }
        // Unbind and rebind the click callback to ALL nodes
        loadYoutube(title); 
        $("circle").unbind("click");
        $("circle").click(clickMovieNode);
    });
}

function clickMovieNode(event) {
    if ($(event.target).attr('clicked') !== 'true') {
        $(event.target).attr('clicked', 'true');
        var title = $(event.target).next().text();
        expandMovieNode(title);
        getMovieFromImdb(title, function (movie) {
            putMovieInSidebar(movie);
            $(event.target).attr('clicked', 'false');
        });
    }
}

function initializeInitialInputBox() {
    $("#initial-input-box").keyup(function (event) {
        if (event.keyCode == 13) {
            $("#initial-input-box").attr('disabled', 'true');
            getMovieFromImdb(document.getElementById("initial-input-box").value, function(movie) {
                $("#initial-input-box").remove();
                graph.addNode(movie.title, movie.genres[0], movie.rating);
                expandMovieNode(movie.title);
                putMovieInSidebar(movie);
            });
        }
    });
}

initializeInitialInputBox();
