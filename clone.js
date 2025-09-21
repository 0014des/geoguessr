/* jshint esversion: 6 */
/* jshint node: true */
'use strict';


// 複数回「推測」ボタンを押す機能を変更
var map;
var resultmap;
var markers = [];
var guess_coordinates = []; // 推測した座標
var true_location = [];     // 正しい位置
var us_city_set = [4699066, 5809844, 4164138, 4440906,4894465, 2562501]; // 米国の都市IDセット
var world_city_set =[3143244, 3599699, 1857910, 4853608, 323786]; // 世界の都市IDセット
var accumulated_distance = 0; // 累計距離
var current_name = '';        // 現在の場所の名前
var distance_from_guess = []; // 推測からの距離
var check_count = 0;          // チェックボタンを押した回数


async function getData(url) {
  return fetch(url)
      .then(response => response.json())
      .catch(error => console.log(error));
}

async function initialize() {
    check_count = 0;
    disableButton('check'); // 「推測！」ボタンを無効化
    disableButton('next');  // 「次の場所」ボタンを無効化
    if(accumulated_distance == 0){
      document.getElementById("totaldistance").innerHTML = 'ラウンドスコア: 0 マイル'; 
    }
    document.getElementById("location").innerHTML = ' ';
    document.getElementById("distance").innerHTML = ' '; 


    var number = await Promise.all([getData(`https://api.openweathermap.org/data/2.5/weather?id=${randomLoc()}&APPID=2e35570eab59959f85e835dabdddc726`)]);
    true_location = [];
    true_location.push(number[0].coord.lat,number[0].coord.lon);
    current_name = (number[0].name + ", " + number[0].sys.country);
        
    
    var luther = {lat: 43.31613189259254, lng: -91.80256027484972};
  
    var map = new google.maps.Map(document.getElementById('map'), {
      center: luther,
      zoom: 1,
      streetViewControl: false, // ストリートビューコントロールを非表示
    });

    var rmap = new google.maps.Map(document.getElementById('result'), {
        center: luther,
        zoom: 2,
        streetViewControl: false, // ストリートビューコントロールを非表示
        zoomControl: true,        // ズームコントロールを表示
        zoomControlOptions: {
            position: google.maps.ControlPosition.LEFT_CENTER // ズームコントロールの位置
    },
      });

    
    google.maps.event.addListener(map, 'click', function(event) {
        placeMarker(event.latLng); // マーカーを配置
        if (check_count == 0){
          enableButton('check'); // 「推測！」ボタンを有効化
          check_count += 1;
        }
     });
     
     function placeMarker(location) {
         deleteMarkers(); // マーカーを削除
         guess_coordinates = [];
         var marker = new google.maps.Marker({
             position: location, 
             map: map,
         });
         markers.push(marker);
         guess_coordinates.push(marker.getPosition().lat(),marker.getPosition().lng());
        }

    
    var panorama = new google.maps.StreetViewPanorama(
        document.getElementById('pano'), {
          position: {lat: number[0].coord.lat, lng: number[0].coord.lon},
          pov: {
            heading: 34,
            pitch: 10
          },
          addressControl: false // 住所コントロールを非表示
        });
    map.setStreetView(panorama);
  
}

  function setMapOnAll(map) {
    for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
    }
  }

  function clearMarkers() {
    setMapOnAll(null);
  }

  function showMarkers() {
    setMapOnAll(map);
  }

  function deleteMarkers() {
    clearMarkers();
    markers = [];
  }

function check(){

    enableButton('next'); // 「次の場所」ボタンを有効化
    distance_from_guess = [];
    var guess_error = (distance(guess_coordinates[0],guess_coordinates[1],true_location[0], true_location[1],'K'));
    accumulated_distance += parseFloat(guess_error);
    distance_from_guess = guess_error;

    /*
    console.log("Guessed Location: " + guess_coordinates); // 推測した場所
    console.log("Actual Location: " + true_location);     // 実際の位置
    console.log("current guess error: " + guess_error);   // 現在の推測誤差
    console.log("total guess error: " + accumulated_distance); // 推測誤差の合計
   */
    var true_coords = {lat: true_location[0], lng: true_location[1]};
    var guess_coords = {lat: guess_coordinates[0], lng: guess_coordinates[1]};
    var result_map = new google.maps.Map(document.getElementById('result'), {
    zoom: 2,
    center: true_coords
  });

  var true_marker = new google.maps.Marker({
    position: true_coords, 
    map: result_map,
    title: '正しい場所', // マーカーのタイトル
    icon: {
        url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" // 緑色のアイコン
      }
  });
    var infoWindow = new google.maps.InfoWindow({
        content: current_name
    })

    true_marker.addListener('click', function(){
        infoWindow.open(result_map, true_marker);
    });

  var guess_marker = new google.maps.Marker({
    position: guess_coords,
    map: result_map,
    title: '推測した場所', // マーカーのタイトル
    icon: {
      url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" // 赤色のアイコン
    }
  });

  var flightPlanCoordinates = [
    true_coords, guess_coords,
    
  ];
  var lineSymbol = {
    path: 'M 0,-1 0,1',
    strokeOpacity: 1,
    scale: 2
  };

  var flightPath = new google.maps.Polyline({
    path: flightPlanCoordinates,
    strokeOpacity: 0,
    icons: [{
        icon: lineSymbol,
        offset: '1',
        repeat: '15px'
      }],
  });

  flightPath.setMap(result_map);
  display_location(); // 場所を表示
  disableButton('check'); // 「推測！」ボタンを無効化
}

function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return (dist / 1.609).toFixed(1)
    ;
	}
}


var index = -1;
function randomLoc(){
    index += 1
    if (index > world_city_set.length -1){
        index = 0
        //console.log(index)
        document.getElementById("totaldistance").innerHTML = 'ラウンドスコア: 0 マイル'; 
        swal({
            title: "プレイしてくれてありがとう！", // タイトル
            icon: "success",                     // アイコン
            text: "今回のラウンドでの推測誤差は合計で " + accumulated_distance.toFixed(1) + " マイルでした！" // テキスト
        });
        accumulated_distance = 0;
        document.getElementById('round').innerHTML = "ラウンド:  1/" + world_city_set.length
        document.getElementById("next").innerHTML= "次の場所";
        return[world_city_set[0]]

    }else if(index == world_city_set.length -1){
        document.getElementById("next").innerHTML= "ラウンド終了"; // ボタンのテキスト
        document.getElementById('round').innerHTML = "ラウンド: " + (index + 1) + "/" + world_city_set.length
        return[world_city_set[index]]
    }else{
        //console.log(index);
        document.getElementById("next").innerHTML= "次の場所"; // ボタンのテキスト
        document.getElementById('round').innerHTML = "ラウンド: " + (index + 1) + "/" + world_city_set.length
        return[world_city_set[index]]
    }
   
}

function display_location(){
    document.getElementById("location").innerHTML = "正しい場所: " + current_name;
    document.getElementById("distance").innerHTML = "あなたの推測は " + distance_from_guess + " マイル離れていました";
    document.getElementById("totaldistance").innerHTML = "ラウンドスコア: " + accumulated_distance.toFixed(1) + " マイル";
}

function disableButton(id){
  document.getElementById(id).disabled = true;
}

function enableButton(id){
  document.getElementById(id).disabled = false;
}