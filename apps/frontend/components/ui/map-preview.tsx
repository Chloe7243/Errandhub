import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { StyleSheet, View, ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

type Props = {
  firstLat: number;
  firstLng: number;
  finalLat?: number;
  finalLng?: number;
  style?: ViewStyle;
};

const buildHtml = (
  firstLat: number,
  firstLng: number,
  finalLat?: number,
  finalLng?: number,
  dark?: boolean,
) => {
  const hasDropoff = finalLat !== undefined && finalLng !== undefined;

  const centreLat = hasDropoff ? (firstLat + finalLat!) / 2 : firstLat;
  const centreLng = hasDropoff ? (firstLng + finalLng!) / 2 : firstLng;

  const padding = 0.012;
  const lats = hasDropoff ? [firstLat, finalLat!] : [firstLat];
  const lngs = hasDropoff ? [firstLng, finalLng!] : [firstLng];
  const south = Math.min(...lats) - padding;
  const north = Math.max(...lats) + padding;
  const west = Math.min(...lngs) - padding;
  const east = Math.max(...lngs) + padding;

  const dropoffMarker = hasDropoff
    ? `L.marker([${finalLat}, ${finalLng}], {
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

    L.marker([${firstLat}, ${firstLng}], {
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
  firstLat,
  firstLng,
  finalLat,
  finalLng,
  style,
}: Props) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "dark"];
  const dark = colorScheme === "dark";

  const html = buildHtml(firstLat, firstLng, finalLat, finalLng, dark);

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
