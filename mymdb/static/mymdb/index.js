
// constants
var standardRadius = 20;
var width = window.innerWidth * 0.7;
var height = window.innerHeight;

//Set up the colour scale
// var color = d3.scale.category20();
    
// //Append a SVG to the body of the html page. Assign this SVG as an object to svg
// var svg = d3.select("#graph").append("svg")
//     .attr("width", width)
//     .attr("height", height);

// //Set up the force layout
// var force = d3.layout.force()
//     .charge(-40)
//     .linkDistance(standardRadius * 4)
//     .size([width, height]);

// //Now we are giving the SVGs co-ordinates - the force layout is generating the co-ordinates which this code is using to update the attributes of the SVG elements
// force.on("tick", function () {
//     // link.attr("x1", function (d) {
//     //     return d.source.x;
//     // })
//     //     .attr("y1", function (d) {
//     //     return d.source.y;
//     // })
//     //     .attr("x2", function (d) {
//     //     return d.target.x;
//     // })
//     //     .attr("y2", function (d) {
//     //     return d.target.y;
//     // });

//     node.attr("cx", function (d) {
//         return d.x;
//     })
//         .attr("cy", function (d) {
//         return d.y;
//     })

//     node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
// });


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

function myGraph(el) {

    // Add and remove elements on the graph object
    this.addNode = function (title, genre) {
        nodes.push({"title":title,"genre":genre});
        update();
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
            links.push({"source": sourceNode, "target": targetNode});
            update();
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
        .gravity(.05)
        .distance(100)
        .charge(-400)
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
            .call(force.drag);

        nodeEnter.append("circle")
            .attr("r", standardRadius);

        // nodeEnter.append("image")
        //     .attr("class", "circle")
        //     .attr("xlink:href", "https://d3nwyuy0nl342s.cloudfront.net/images/icons/public.png")
        //     .attr("x", "-8px")
        //     .attr("y", "-8px")
        //     .attr("width", "16px")
        //     .attr("height", "16px");

        nodeEnter.append("text")
            .attr("class", "nodetext")
            .attr("dx", 12)
            .attr("dy", ".35em");

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

// // You can do this from the console as much as you like...
// graph.addNode("Cause");
// graph.addNode("Effect");
// graph.addLink("Cause", "Effect");
// graph.addNode("A");
// graph.addNode("B");
// graph.addLink("A", "B");
// graph.addLink("B", "Cause");

// graph.addNode("title", "genre");
// graph.addNode("title2", "genre2");
// graph.addNode("title3", "genre3");
// graph.addLink("title", "title2");
// graph.addLink("title2", "title3");

function get_movie(title) {
    $.get('/movies/title/' + title, function (data) {
        graph.addNode(data.title, data.genres[0]);
        var parentTitle = data.title;

        // get neighbors
        $.get('/movies/title/' + title + '/recommendations', function (data) {
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    graph.addNode(data[key][0], data[key][1]);
                    graph.addLink(parentTitle, data[key][0]);
                }
            }
            console.log(data);
        });        
    });

    // get the data
    // parse the data
    // build the graph
}


// //Creates the graph data structure out of the json data
// force.nodes(graph.nodes)
//     .links(graph.links)
//     .start();


// //Create all the line svgs but without locations yet
// var link = svg.selectAll(".link")
//     .data(graph.links)
//     .enter().append("line")
//     .attr("class", "link")
//     .attr("stroke-width", 2)
//     .attr("stroke", "black")


// //Do the same with the circles for the nodes - no 
// var node = svg.selectAll(".node")
//     .data(graph.nodes)
//     .enter().append("g")
//     .attr("class", "node")
//     .style("fill", function (d) {
//         return color(d.group);
//     })
//     .on("mouseover", mouseover)
//     .on("mouseout", mouseout)
//     .call(force.drag)

// node.append("circle").attr("r", standardRadius)

