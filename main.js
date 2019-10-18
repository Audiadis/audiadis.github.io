var store_lat;
var store_lng;
var user_lat;
var user_lng;
var hot_tubes;
var playlist_user;
var wrong_location_error = 'Vous ne pouvez pas commander des morceaux que dans le magasin.';
var no_location_error = 'Veuillez activer le GPS de votre portable et authorizer ce site.';

if (confirm('Cette app a besoin d\'accès au GPS pour fonctionner')) {
	navigator.geolocation.getCurrentPosition(function(){});
}

fetch_store_data();
fetch_hot_tubes();

async function fetch_store_data() {
	var cur_url = new URL(window.location);
	var code = cur_url.searchParams.get("code");
	var url = window.location.protocol + '//' + window.location.hostname + '/api/jukebox/store?code=' + code;
	var response = await fetch(url);
	var data = await response.json();
	if (data.length != 1) {
		leave_app('Erreur code magasin');
	}
	store_lat = parseFloat(data[0].lat);
	store_lng = parseFloat(data[0].lng);
	playlist_user = data[0].playlist_user;
	document.getElementById('store_lat').textContent = store_lat;
	document.getElementById('store_lng').textContent = store_lng;

	document.getElementById('diff_lat').textContent = store_lat - user_lat;
	document.getElementById('diff_lng').textContent = store_lng - user_lng;
}

async function fetch_hot_tubes() {
	var url = window.location.protocol + '//' + window.location.hostname + '/api/jukebox/hot_tube';
	var response = await fetch(url);
	var data = await response.json();
	if (data.length > 0) {
		hot_tubes = data;
	}
	render_hot_tubes(hot_tubes);
}

function render_hot_tubes(hot_tubes) {
	for (hot_tube of hot_tubes) {
		document.getElementById('hot_tubes').innerHTML += '<div><img onclick="try_song(\'' + hot_tube.filename + '\');" src="' + hot_tube.image + '"></div><br>';
	}
}

function geo_in_store(store_lat, store_lng, user_lat, user_lng) {
	var diff_lat = Math.abs(store_lat - user_lat);
	var diff_lng = Math.abs(store_lng - user_lng);
	//if (diff_lat.toFixed(3) != 0.000 || diff_lng.toFixed(3) != 0.000) {
	if (diff_lat.toString().substring(0,5) != '0.000' || diff_lng.toString().substring(0,5) != '0.000') {
		return false;
	} else {
		return true;
	}
}

function get_position_callback(err) {
	console.log(`ERROR(${err.code}): ${err.message}`);
	//leave_app("L'accès au GPS est nécessaire pour pouvoir utiliser cette app");
	alert(no_location_error);
}

var options = {
	enableHighAccuracy: true,
	timeout: 5000,
	maximumAge: 0
};

function try_song(filename) {
	navigator.geolocation.getCurrentPosition (function(position) {
		 get_position_callback (play_song, filename, position);
	}, get_position_callback);
}

function get_position_callback (play_song, song, position) {
	try {
		user_lat = position.coords.latitude;
		user_lng = position.coords.longitude;
		console.log('Position updated');
		document.getElementById('user_lat').textContent = user_lat;
		document.getElementById('user_lng').textContent = user_lng;
		document.getElementById('diff_lat').textContent = store_lat - user_lat;
		document.getElementById('diff_lng').textContent = store_lng - user_lng;
		if (user_lat.toString().length == 0 && user_lng.toString().length == 0) {
			console.log('leave_app()');
			//leave_app();
		}
		if (!geo_in_store(store_lat, store_lng, user_lat, user_lng)) {
			alert(wrong_location_error);
			return false;
		} else {
			play_song(song);
		}
	} catch (e) {
		alert(no_location_error);
	}

}

async function play_song(filename) {
	var url = window.location.protocol + '//' + window.location.hostname + '/api/jukebox/request';
	post_data = {"app_user":"aaaaaaaaaa", "playlist_user":playlist_user,"filename":filename};
	var response = await fetch(url, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(post_data)});
	var response_json = await response.json();
	console.log(response_json);
	var status = response_json.status;
	if (status == 1) {
		alert("Votre choix a été bien ajouté à la queue;");
	} else {
		alert(response_json.message);
	}
}

function leave_app(message) {
	if (message) {
		alert(message);
	}
	window.location = "https://www.centrakor.com";
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('service-worker.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
