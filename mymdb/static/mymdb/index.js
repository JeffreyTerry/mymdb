
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

var input;
$("#initial-input-box").keyup(function (event) {
    if (event.keyCode == 13) {
        input = document.getElementById("initial-input-box").value;
        get_movie(input);
        // TODO move this so that we don't delete the input box if the imdb search fails
        document.getElementById("initial-input-box").remove(document.getElementById("initial-input-box"));
    }
});

var seen = new Set();
var node_seen = new Set();

function myGraph(el) {

    // Add and remove elements on the graph object
    this.addNode = function (title, genre, rating) {
        if (!node_seen.has(title)) {
            nodes.push({"title":title,"genre":genre}, "rating": rating);
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
            .attr("r", standardRadius)
            

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


function get_movie(title) {
    $.get('/movies/title/' + title, function (data) {
        graph.addNode(data.title, data.genres[0], data.rating);
        var parentTitle = data.title;

        $.get('/movies/title/' + parentTitle, function (data) {
                $("#sb-title").text(data.title);
                $("#sb-director").text("By: " + data.director);
                $("#sb-metacritic-rating").text("Metacritic: " + data.metascore);
                $("#sb-imdb-rating").text("IMDb: " + data.rating);
                $("#sb-plot").text(data.plot);
                $("#sb-photo").html('<img src="' + data.cover_url + '"></div>');
        });

        $.get('/movies/title/' + title + '/recommendations', function (data) {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    graph.addNode(data[key][0], data[key][1], data[key][2]);
                    graph.addLink(parentTitle, data[key][0]);
                }
            }
            $("circle").unbind("click");
            $("circle").click(function (event) {
                console.log("hi");
                var title = $(event.target).next().text()
                switch_movie(title)
                $.get('/movies/title/' + title, function (data) {
                    $("#sb-title").text(data.title);
                    $("#sb-director").text("By: " + data.director);
                    $("#sb-metacritic-rating").text("Metacritic: " + data.metascore);
                    $("#sb-imdb-rating").text("IMDb: " + data.rating);
                    $("#sb-plot").text(data.plot);
                    $("#sb-photo").html('<img src="' + data.cover_url + '"></div>');
                });
            });
        });        
    });
}



function switch_movie(title) {
    $.get('/movies/title/' + title + '/recommendations', function (data) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                graph.addNode(data[key][0], data[key][1], data[key][2]);
                graph.addLink(title, data[key][0]);
            }
        }
        $("circle").unbind("click");
        $("circle").click(function (event) {
            console.log("hi");
            var title = $(event.target).next().text()
            switch_movie(title)
            $.get('/movies/title/' + title, function (data) {
                $("#sb-title").text(data.title);
                $("#sb-director").text("By: " + data.director);
                $("#sb-metacritic-rating").text("Metacritic: " + data.metascore);
                $("#sb-imdb-rating").text("IMDb: " + data.rating);
                $("#sb-plot").text(data.plot);
                $("#sb-photo").html('<img src="' + data.cover_url + '"></div>');
            });
        });
    });        
}
