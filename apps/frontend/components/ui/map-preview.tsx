import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, View, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  firstLat: number;
  firstLng: number;
  currentLat?: number;
  currentLng?: number;
  finalLat?: number;
  finalLng?: number;
  firstColor?: string;
  currentColor?: string;
  lastColor?: string;
};

/**
 * Construct the Leaflet+OpenStreetMap HTML document embedded in the map
 * WebView. We use a WebView instead of react-native-maps because:
 *   - no Google API key / billing setup (student project)
 *   - one HTML string renders identically on iOS and Android
 *   - CARTO's dark basemap aligns with the app's dark theme
 * The HTML is rebuilt on every render because coordinates are baked into
 * the script — there's no meaningful cache key to invalidate separately.
 */
const buildHtml = (props: Props & { dark?: boolean }) => {
  const hasDropoff =
    props.finalLat !== undefined && props.finalLng !== undefined;
  const hasCurrentLocation =
    props.currentLat !== undefined && props.currentLng !== undefined;

  // Pad the bounding box so pins don't sit flush against the edges of the
  // tile. ~0.012 degrees ≈ 1.3km which works well for typical campus-scale
  // pickup/drop-off distances in this app.
  const padding = 0.012;
  const lats = hasDropoff
    ? [props.firstLat, props.finalLat!]
    : [props.firstLat];
  const lngs = hasDropoff
    ? [props.firstLng, props.finalLng!]
    : [props.firstLng];
  const south = Math.min(...lats) - padding;
  const north = Math.max(...lats) + padding;
  const west = Math.min(...lngs) - padding;
  const east = Math.max(...lngs) + padding;

  const dropoffMarker = hasDropoff
    ? `L.marker([${props.finalLat}, ${props.finalLng}], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;border-radius:50%;background:${props.lastColor};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
      }).addTo(map).bindPopup('Drop-off');`
    : "";

  const currentMarker = hasCurrentLocation
    ? `L.marker([${props.currentLat}, ${props.currentLng}], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;border-radius:50%;background:${props.currentColor};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
      }).addTo(map).bindPopup('Drop-off');`
    : "";

  const tileUrl = props.dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = props.dark
    ? "&copy; OpenStreetMap &copy; CARTO"
    : "&copy; OpenStreetMap contributors";

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .leaflet-control-attribution { display: none; }
    .leaflet-control-zoom { display: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    var map = L.map('map', { zoomControl: false, attributionControl: false })
      .fitBounds([[${south},${west}],[${north},${east}]]);

    L.tileLayer('${tileUrl}', { attribution: '${attribution}', maxZoom: 19 }).addTo(map);

    L.marker([${props.firstLat}, ${props.firstLng}], {
      icon: L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:50%;background:${props.firstColor};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
    }).addTo(map).bindPopup('Pickup');

    ${currentMarker}
    ${dropoffMarker}
  </script>
</body>
</html>`;
};

/**
 * Small non-interactive map card used on errand details / tracking screens.
 *
 * Drops pins for the pickup, optional current helper location, and optional
 * drop-off, fits the viewport to show all of them with a little padding,
 * and switches the basemap between CARTO dark and OSM standard based on
 * the active colour scheme. Pan/zoom and attribution are disabled since
 * this is a preview only.
 */
const MapPreview = ({ style, ...mapProps }: Props & { style?: ViewStyle }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const dark = colorScheme === "dark";

  const html = buildHtml({ ...mapProps, dark });

  return (
    <View style={[styles.container, { borderColor: colors.border }, style]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        originWhitelist={["*"]}
        javaScriptEnabled
      />
    </View>
  );
};

export default MapPreview;

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    height: 180,
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
