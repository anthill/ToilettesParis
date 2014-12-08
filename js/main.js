'use strict';

var geo = require('./geolocation.js');
var getToilets = require('./getJSON.js');
var findClosests = require('./findClosests.js');
var createInfos = require('./createInfos.js');
var render = require('./renderMap.js');
var activateFilters = require('./modeActivation.js');

var typologieToCSSClass = {
	"WCG": "sanitaire",
	"WCH": "sanitaire",
	"WCH2": "sanitaire",
	"WCP": "sanitaire",
	"WCPC": "sanitaire"
};

function isHandi(type){
	if (type === 'WCH' || type === 'WCH2')
		return true;
	else return false;
}

/// MAIN CODE

// Get toilets position
var toilettesP = getToilets('data/sanisettesparis2011.json')
	.then(function(data){
		// console.log('raw', data);
		// console.log('raw', data[0]);
		
		return data.map(function(t){
			// var test = typologieToCSSClass[t["typologie"]];
			var option = isHandi(t.fields.info);

			// if (!test)
			// 	console.error(t);
			// else {
				return {
					lng: parseFloat(t.geometry.coordinates[0]),
					lat: parseFloat(t.geometry.coordinates[1]),
					class: typologieToCSSClass[t.fields.info],
					handicap: option,
					marker: undefined
				};
			// }
		});
	});

var modes = ['sanitaire', 'handicap'];


// render points on map regardless of geolocation
toilettesP
	.then(function(toilettes){
		console.log(toilettes);
        render({
            toilettes: toilettes,
            position: undefined,
            infos : undefined
        });
        activateFilters(toilettes, modes);
	});

var positionP = geo.getCurrentPosition();

// When user and toilet positions are available:
Promise.all([toilettesP, positionP])
	.then(function(values){
		var toilettes = values[0],
			position = values[1];

		findClosests(toilettes, position).then(function(itineraries){

			console.log('Position :', position);
			console.log('Itineraries :', itineraries);

			var infos = itineraries.map(createInfos);

			console.log('Infos :', infos);

			render({
				toilettes: toilettes,
				position: position,
				infos: infos
			});

		})
		.catch(function(err){console.error(err);});
		
	})
	.catch(function(err){console.error(err);});
