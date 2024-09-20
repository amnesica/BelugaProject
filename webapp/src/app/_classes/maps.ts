export class Maps {
  static listAvailableFreeMaps = [
    {
      name: 'OSM Standard',
      url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      isSelected: false,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>  contributors.',
    },
    {
      name: 'CartoDB Voyager',
      url: 'https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      isSelected: false,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
      name: 'CartoDB Light',
      url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      isSelected: false,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
      name: 'CartoDB Light (no labels)',
      url: 'https://{a-d}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
      isSelected: false,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
      name: 'CartoDB Dark',
      url: 'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      isSelected: false,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
      name: 'CartoDB Dark (no labels)',
      url: 'https://{a-d}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
      isSelected: false,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    {
      name: 'ESRI.com Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.esri.com">Esri.com</a>' +
        '— Sources: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
    {
      name: 'ESRI.com Gray',
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.esri.com">Esri.com</a>' +
        '— Sources: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
    {
      name: 'ESRI.com Streets',
      url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.esri.com">Esri.com</a>' +
        '— Sources: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    },
    {
      name: 'Stadia Alidade Smooth',
      url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png',
      isSelected: false,
      attribution: [
        '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>',
        '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
        '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
      ],
    },
    {
      name: 'Stadia Alidade Smooth Dark',
      url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
      isSelected: false,
      attribution: [
        '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>',
        '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
        '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
      ],
    },
    {
      name: 'Stadia Alidade Outdoors',
      url: 'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}.png',
      isSelected: false,
      attribution: [
        '&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>',
        '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
        '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>',
      ],
    },
    {
      name: 'OSM OpenSeaMap',
      url: 'http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
      isSelected: false,
      attribution: [
        'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a>',
      ],
    },
  ];

  static listAvailableGeoapifyMaps = [
    {
      name: 'OSM Carto',
      url: 'https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
    },
    {
      name: 'OSM Bright',
      url: 'https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
    },
    {
      name: 'OSM Bright Grey',
      url: 'https://maps.geoapify.com/v1/tile/osm-bright-grey/{z}/{x}/{y}.png?apiKey=',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
    },
    {
      name: 'OSM Bright Smooth',
      url: 'https://maps.geoapify.com/v1/tile/osm-bright-smooth/{z}/{x}/{y}.png?apiKey=',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
    },
    {
      name: 'Klokantech Basic',
      url: 'https://maps.geoapify.com/v1/tile/klokantech-basic/{z}/{x}/{y}.png?apiKey=',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
    },
    {
      name: 'Dark Matter',
      url: 'https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
    },
    {
      name: 'Dark Matter Brown',
      url: 'https://maps.geoapify.com/v1/tile/dark-matter-brown/{z}/{x}/{y}.png?apiKey=',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
    },
    {
      name: 'Dark Matter Dark Grey',
      url: 'https://maps.geoapify.com/v1/tile/dark-matter-dark-grey/{z}/{x}/{y}.png?apiKey=',
      isSelected: false,
      attribution:
        'Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">© OpenStreetMap</a>',
    },
  ];
}
