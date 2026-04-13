import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, View, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  pickupLat: number;
  pickupLng: number;
  dropoffLat?: number;
  dropoffLng?: number;
  style?: ViewStyle;
};

const buildHtml = (
  pickupLat: number,
  pickupLng: number,
  dropoffLat?: number,
  dropoffLng?: number,
  dark?: boolean,
) => {
  const hasDropoff = dropoffLat !== undefined && dropoffLng !== undefined;

  const centreLat = hasDropoff ? (pickupLat + dropoffLat!) / 2 : pickupLat;
  const centreLng = hasDropoff ? (pickupLng + dropoffLng!) / 2 : pickupLng;

  const padding = 0.012;
  const lats = hasDropoff ? [pickupLat, dropoffLat!] : [pickupLat];
  const lngs = hasDropoff ? [pickupLng, dropoffLng!] : [pickupLng];
  const south = Math.min(...lats) - padding;
  const north = Math.max(...lats) + padding;
  const west = Math.min(...lngs) - padding;
  const east = Math.max(...lngs) + padding;

  const dropoffMarker = hasDropoff
    ? `L.marker([${dropoffLat}, ${dropoffLng}], {
        icon: L.divIcon({
          className: '',
          html: '<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        })
      }).addTo(map).bindPopup('Drop-off');`
    : "";

  const tileUrl = dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const attribution = dark
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

    L.marker([${pickupLat}, ${pickupLng}], {
      icon: L.divIcon({
        className: '',
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#6366f1;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4)"></div>',
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      })
    }).addTo(map).bindPopup('Pickup');

    ${dropoffMarker}
  </script>
</body>
</html>`;
};

const MapPreview = ({
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  style,
}: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const dark = colorScheme === "dark";

  const html = buildHtml(pickupLat, pickupLng, dropoffLat, dropoffLng, dark);

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
