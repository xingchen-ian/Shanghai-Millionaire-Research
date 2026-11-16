/* Self-hosted Shanghai basemap.
   Leaflet and these tiles are served with the site so the map does not depend on
   unpkg, CARTO, or tile.openstreetmap.org (those hosts fail or, for CARTO Positron,
   return an "API key required" placeholder). Tiles are rendered from OpenStreetMap. */
(function (global) {
    var COVERAGE = {
        south: 31.12,
        west: 121.33,
        north: 31.31,
        east: 121.59,
        minZoom: 11,
        maxNativeZoom: 16
    };

    var ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    var FAIL_TEXT = '底图未能加载。标记仍可查看。 Basemap tiles could not be loaded. Markers are still available.';
    var ZOOM_TEXT = '放大后可看到上海街道底图。 Zoom in to see the Shanghai streets.';

    function xyz(lat, lng, zoom) {
        var z = Math.max(COVERAGE.minZoom, Math.min(COVERAGE.maxNativeZoom, zoom));
        var n = Math.pow(2, z);
        var x = Math.floor((lng + 180) / 360 * n);
        var latRad = lat * Math.PI / 180;
        var y = Math.floor((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n);
        return { z: z, x: x, y: y };
    }

    function tileUrl(lat, lng, zoom) {
        var t = xyz(lat, lng, zoom);
        return 'vendor/tiles/' + t.z + '/' + t.x + '/' + t.y + '.png';
    }

    function noteEl(map) {
        if (map._basemapNote) return map._basemapNote;
        var el = document.createElement('div');
        el.setAttribute('role', 'status');
        el.style.cssText = [
            'display:none',
            'position:absolute',
            'z-index:800',
            'left:10px',
            'bottom:20px',
            'max-width:min(340px, calc(100% - 20px))',
            'padding:7px 10px',
            'background:rgba(255,254,250,0.95)',
            'color:#2c2a25',
            'border:1px solid #d4cfc5',
            'border-radius:4px',
            'font:13px/1.45 Georgia, "Source Sans 3", "Noto Serif SC", serif',
            'box-shadow:0 1px 3px rgba(0,0,0,0.12)',
            'pointer-events:none'
        ].join(';');
        map.getContainer().appendChild(el);
        map._basemapNote = el;
        return el;
    }

    function showNote(map, text) {
        var el = noteEl(map);
        el.textContent = text;
        el.style.display = 'block';
        map._basemapHardFail = text === FAIL_TEXT;
    }

    function syncZoomNote(map) {
        if (map._basemapHardFail) return;
        if (map.getZoom() < COVERAGE.minZoom) showNote(map, ZOOM_TEXT);
        else if (map._basemapNote) map._basemapNote.style.display = 'none';
    }

    function installShanghaiBasemap(map) {
        if (global.L && L.Icon && L.Icon.Default) {
            L.Icon.Default.imagePath = 'vendor/leaflet/images/';
        }

        var layer = L.tileLayer('vendor/tiles/{z}/{x}/{y}.png', {
            attribution: ATTR,
            minZoom: COVERAGE.minZoom,
            maxZoom: 19,
            maxNativeZoom: COVERAGE.maxNativeZoom,
            bounds: L.latLngBounds(
                [COVERAGE.south, COVERAGE.west],
                [COVERAGE.north, COVERAGE.east]
            ),
            errorTileUrl: 'vendor/tiles/blank.png'
        }).addTo(map);

        var container = map.getContainer();
        if (container && container.style) container.style.background = '#ece9e2';

        map._basemapHardFail = false;
        syncZoomNote(map);
        map.on('zoomend', function () { syncZoomNote(map); });

        var probe = new Image();
        probe.onload = function () {
            if (!map._basemapHardFail) syncZoomNote(map);
        };
        probe.onerror = function () { showNote(map, FAIL_TEXT); };
        probe.src = tileUrl(31.23, 121.47, 13);

        return layer;
    }

    global.installShanghaiBasemap = installShanghaiBasemap;
})(window);
