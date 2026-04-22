ALTER TABLE "Errand" RENAME COLUMN "pickupLocation" TO "firstLocation";
ALTER TABLE "Errand" RENAME COLUMN "dropoffLocation" TO "finalLocation";
ALTER TABLE "Errand" RENAME COLUMN "pickupReference" TO "locationReference";
ALTER TABLE "Errand" RENAME COLUMN "pickupLat" TO "firstLat";
ALTER TABLE "Errand" RENAME COLUMN "pickupLng" TO "firstLng";
ALTER TABLE "Errand" RENAME COLUMN "dropoffLat" TO "finalLat";
ALTER TABLE "Errand" RENAME COLUMN "dropoffLng" TO "finalLng";
