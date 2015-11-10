// // 2. This code loads the IFrame Player API code asynchronously.
// var tag = document.createElement('script');

// tag.src = "https://www.youtube.com/iframe_api";
// var firstScriptTag = document.getElementsByTagName('script')[0];
// firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// // 3. This function creates an <iframe> (and YouTube player)
// //    after the API code downloads.
// var player;
// function onYouTubeIframeAPIReady() {
//   player = new YT.Player('sb-trailer', {
//     height: document.getElementById('sidebar').offsetWidth / 16 * 9,
//     width: document.getElementById('sidebar').offsetWidth,
//     events: {
//       'onReady': onPlayerReady
//     }
//   });
// }

// // 4. The API will call this function when the video player is ready.
// function onPlayerReady(event) {
//   event.target.src = "https://www.youtube.com/embed/?listType=search&list=django unchained trailer";
//   // playVideo();
// }



function yt_init () {
	gapi.client.setApiKey("AIzaSyBlb7Viu_8q9wxPCVCrMbS3orFU8f8I93Q");
	gapi.client.load("youtube", "v3", function () {
		// yt api is ready
	});
}

function loadYoutube(title) {
	var query = title.replace(" ", "+")+"trailer";

	var request = gapi.client.youtube.search.list({
		part : "snippet",
		type : "video", 
		maxResults : 1,
		order: "viewCount",
		q: query
	});

	request.execute(function (response) {
		var item = response.result.items[0];

		console.log(item.snippet.title);
		console.log(item.id.videoId);

		$("#video").html('<iframe id="video-player" type="text/html" src="http://www.youtube.com/embed/' + item.id.videoId + '" frameborder="0" allowfullscreen></iframe>');

	});	
}





