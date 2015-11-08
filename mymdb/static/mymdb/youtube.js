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