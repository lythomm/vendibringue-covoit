<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import L from "leaflet";
// @ts-ignore
if (typeof window !== 'undefined') window.L = L;
import { getAvatarUrl } from "@/lib/user";
import confetti from "canvas-confetti";

const router = useRouter();
const auth = useAuthStore();

// ==========================================
// === 1. STATE & REFS ===
// ==========================================
const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let epicenterMarker: L.Marker | null = null;
let userMarker: L.Marker | L.CircleMarker | null = null;
let routeLayer: L.LayerGroup | null = null;
let markerLayerGroup: any | null = null;
let realtimeChannel: any = null;

const isOffline = ref(!navigator.onLine);
const updateOnlineStatus = () => {
  isOffline.value = !navigator.onLine;
};

const isEventLoading = ref(false);
const fetchError = ref<string | null>(null);
const isSheetMinimized = ref(false);

const eventData = ref<{
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  address: string | null;
}>({
  id: "ec06065d-6e1c-4775-b843-1e9c2195142f",
  name: "Vendibringue",
  center_lat: 43.51871479457044,
  center_lng: 1.8295761830409003,
  address: "Vendibringue, France",
});

const rides = ref<any[]>([]);
const loadingRides = ref(true);

// Navigation & Role
const currentTab = ref("explorer"); // 'explorer', 'trips', 'messages', 'profile'
const currentRole = ref<"passenger" | "driver">(
  (localStorage.getItem("vb_role") as "passenger" | "driver") || "passenger",
);

// Picking mode
const isPickingLocation = ref(false);
const pickingSheetActive = ref(false);
const pickedCoords = ref<{ lat: number; lng: number } | null>(null);

// Ride selection
const selectedRide = ref<any>(null);
const lastBookedRide = ref<any>(null);
const bookingLoading = ref(false);
const profileSheetActive = ref(false);
const profileLoading = ref(false);
const editedProfile = ref({
  first_name: auth.user?.first_name || "",
  phone: auth.user?.phone || "",
  instagram_id: "",
});
const successSheetActive = ref(false);
const bookingError = ref<string | null>(null);
const userCoords = ref<{ lat: number; lng: number } | null>(null);
const showCancelConfirm = ref(false);
const rideToCancel = ref<string | null>(null);
const showDeleteRideConfirm = ref(false);
const rideToDeleteId = ref<string | null>(null);
const showRemoveParticipantConfirm = ref(false);
const bookingToRemoveId = ref<string | null>(null);
const isAvatarPickerOpen = ref(false);
const avatarOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// PWA Installation
const deferredPrompt = ref<any>(null);
const showInstallBanner = ref(false);
const isStandalone = ref(false);
const isIOS = ref(false);
const isAndroid = ref(false);
const showIOSInstructions = ref(false);
const showAndroidInstructions = ref(false);

// Drag-to-close State
const dragStartY = ref(0);
const dragTranslateY = ref(0);
const isDragging = ref(false);
const activeDraggingSheet = ref<string | null>(null);

function onSheetDragStart(e: TouchEvent, sheetId: string) {
  dragStartY.value = e.touches[0].clientY;
  activeDraggingSheet.value = sheetId;
  isDragging.value = true;
}

function onSheetDragMove(e: TouchEvent) {
  if (!isDragging.value) return;
  const currentY = e.touches[0].clientY;
  const deltaY = currentY - dragStartY.value;

  // We only allow dragging down for sheets (positive deltaY)
  // EXCEPT for the explorer which can also be dragged up if minimized
  if (activeDraggingSheet.value === "explorer") {
    dragTranslateY.value = deltaY;
  } else if (deltaY > 0) {
    dragTranslateY.value = deltaY;
  }
}

function onSheetDragEnd() {
  if (!isDragging.value) return;

  const threshold = 100;

  if (activeDraggingSheet.value === "explorer") {
    // If minimized, dragging up (negative dragTranslateY) expands it
    // If expanded, dragging down (positive dragTranslateY) minimizes it
    const dragThreshold = 80;
    if (isSheetMinimized.value && dragTranslateY.value < -dragThreshold) {
      isSheetMinimized.value = false;
    } else if (
      !isSheetMinimized.value &&
      dragTranslateY.value > dragThreshold
    ) {
      isSheetMinimized.value = true;
    }
  } else {
    // Standard modal sheets
    if (dragTranslateY.value > threshold) {
      if (activeDraggingSheet.value === "selectedRide")
        selectedRide.value = null;
      if (activeDraggingSheet.value === "profile")
        profileSheetActive.value = false;
      if (activeDraggingSheet.value === "success")
        successSheetActive.value = false;
      if (activeDraggingSheet.value === "picking") {
        pickingSheetActive.value = false;
        isEditing.value = false;
        editingRideId.value = null;
      }
    }
  }

  isDragging.value = false;
  dragTranslateY.value = 0;
  activeDraggingSheet.value = null;
}

function checkPWAStatus() {
  const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
  isIOS.value = isIOSDevice;

  const isAndroidDevice = /Android/i.test(navigator.userAgent);
  isAndroid.value = isAndroidDevice;

  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  ) {
    isStandalone.value = true;
  }
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function showBookingError(message: string) {
  bookingError.value = message;
  setTimeout(() => {
    bookingError.value = null;
  }, 5000);
}

// Ride Form Data
const newRide = ref({
  origin_name: "",
  total_seats: 3,
  departure_time: "20:00",
});

const copySuccess = ref(false);
const isEditing = ref(false);
const editingRideId = ref<string | null>(null);

// Route Cache Constants
const ROUTE_CACHE_KEY = "vb_route_cache";
const MAX_ROUTE_CACHE = 20;

function getRouteFromCache(rideId: string, startLat: number, startLng: number) {
  const raw = localStorage.getItem(ROUTE_CACHE_KEY);
  if (!raw) return null;
  try {
    const cache = JSON.parse(raw);
    const entry = cache[rideId];
    if (entry) {
      // Verify starting point hasn't changed (fingerprint)
      if (Math.abs(entry.startLat - startLat) < 0.0001 && Math.abs(entry.startLng - startLng) < 0.0001) {
        // Update timestamp for LRU
        entry.timestamp = Date.now();
        localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
        return entry.coords;
      }
    }
  } catch (e) {
    console.error("Route cache error:", e);
  }
  return null;
}

function saveRouteToCache(rideId: string, startLat: number, startLng: number, coords: number[][]) {
  const raw = localStorage.getItem(ROUTE_CACHE_KEY);
  let cache: any = {};
  if (raw) {
    try {
      cache = JSON.parse(raw);
    } catch (e) {
      cache = {};
    }
  }

  cache[rideId] = {
    startLat,
    startLng,
    coords,
    timestamp: Date.now()
  };

  // LRU: If too many, delete oldest
  const keys = Object.keys(cache);
  if (keys.length > MAX_ROUTE_CACHE) {
    const oldestKey = keys.reduce((a, b) => cache[a].timestamp < cache[b].timestamp ? a : b);
    delete cache[oldestKey];
  }

  localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(cache));
}

function copyCoordinates() {
  const coords = `${eventData.value.center_lat}, ${eventData.value.center_lng}`;
  navigator.clipboard.writeText(coords).then(() => {
    copySuccess.value = true;
    setTimeout(() => {
      copySuccess.value = false;
    }, 2000);
  });
}

function openNavigation(app: "waze" | "google") {
  const { center_lat, center_lng } = eventData.value;
  if (app === "waze") {
    window.open(
      `https://waze.com/ul?ll=${center_lat},${center_lng}&navigate=yes`,
      "_blank",
    );
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${center_lat},${center_lng}`,
      "_blank",
    );
  }
}

watch(currentRole, (role) => {
  localStorage.setItem("vb_role", role);
});

// ==========================================
// === 2. COMPUTED PROPERTIES ===
// ==========================================
const myRide = computed(() => {
  if (!auth.user) return null;
  return rides.value.find((r) => r.driver_id === auth.user?.id) || null;
});

const myBookedRides = computed(() => {
  if (!auth.user) return [];
  return rides.value.filter((r) =>
    r.bookings?.some((b: any) => b.passenger_id === auth?.user?.id),
  );
});

const availableRides = computed(() => {
  const list = rides.value.filter((r) => {
    if (r.status !== "active") return false;
    if (auth.user && r.driver_id === auth.user.id) return false;
    return true;
  });

  if (userCoords.value) {
    return [...list].sort((a, b) => {
      const aUserRide = isPassenger(a.id);
      const bUserRide = isPassenger(b.id);
      if (aUserRide && !bUserRide) return -1;
      if (!aUserRide && bUserRide) return 1;

      const distA = getDistance(
        userCoords.value!.lat,
        userCoords.value!.lng,
        a.origin_lat,
        a.origin_lng,
      );
      const distB = getDistance(
        userCoords.value!.lat,
        userCoords.value!.lng,
        b.origin_lat,
        b.origin_lng,
      );
      return distA - distB;
    });
  }

  return [...list].sort((a, b) => {
    const aUserRide = isPassenger(a.id);
    const bUserRide = isPassenger(b.id);
    if (aUserRide && !bUserRide) return -1;
    if (!aUserRide && bUserRide) return 1;
    return 0;
  });
});

const ridesMarkerData = computed(() => {
  const allVisible = [...availableRides.value];
  if (myRide.value) {
    allVisible.push(myRide.value);
  }

  return allVisible.map((r) => ({
    id: r.id,
    lat: r.origin_lat,
    lng: r.origin_lng,
    seatsLeft: getSeatsLeft(r),
    isUserRide: r.driver_id === auth.user?.id || isPassenger(r.id),
    first_name: r.profiles?.first_name,
    avatar_url: r.profiles?.avatar_url,
  }));
});

const currentMapBounds = ref<L.LatLngBounds | null>(null);

const visibleRidesMarkerData = computed(() => {
  // Simplified: Always return all markers to ensure visibility
  return ridesMarkerData.value;
});

watch(
  visibleRidesMarkerData,
  () => {
    updateMarkers();
  },
  { deep: false },
);

function getBookedCount(ride: any) {
  if (!ride) return 0;
  return (
    ride.bookings?.filter((b: any) => b.status === "confirmed").length || 0
  );
}

function getSeatsLeft(ride: any) {
  if (!ride) return 0;
  return ride.total_seats - getBookedCount(ride);
}

// Reactivity sync: update selectedRide whenever the main rides array changes
watch(
  rides,
  (newRides) => {
    if (selectedRide.value) {
      const freshData = newRides.find((r) => r.id === selectedRide.value.id);
      if (freshData) {
        selectedRide.value = freshData;
      }
    }
  },
  { deep: false },
);

const totalAvailableSeats = computed(() =>
  availableRides.value.reduce((sum, r) => sum + getSeatsLeft(r), 0),
);

const hasPreExistingActivity = computed(() => {
  return !!myRide.value || myBookedRides.value.length > 0;
});

// Update epicenter when event data changes
watch(
  () => eventData.value,
  (newData) => {
    if (map && epicenterMarker && newData) {
      const pos: [number, number] = [newData.center_lat, newData.center_lng];
      epicenterMarker.setLatLng(pos);
      // Optional: map.flyTo(pos, 13);
    }
  },
  { deep: true },
);

// ==========================================
// === 3. CORE LOGIC & API ===
// ==========================================
async function fetchEventData() {
  isEventLoading.value = true;
  fetchError.value = null;

  try {
    // Simplifying to avoid PostgREST 406 by requesting all columns first
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (data) {
      eventData.value = {
        id: data.id,
        name: data.name,
        center_lat: data.center_lat,
        center_lng: data.center_lng,
        address: data.address,
      };
    }
  } catch (err: any) {
    console.error("Error fetching event:", err);
    // fallback is already set in the ref initialization
  } finally {
    isEventLoading.value = false;
  }
}

async function fetchRides() {
  if (!eventData.value?.id) return;
  loadingRides.value = true;

  const { data, error } = await supabase
    .from("rides")
    .select(
      `
      id, driver_id, origin_name, origin_lat, origin_lng,
      total_seats, departure_time, status, description, created_at,
      profiles!rides_driver_id_fkey ( id, first_name, avatar_url, phone, instagram_id ),
      bookings ( 
        id, 
        passenger_id, 
        status,
        profiles:passenger_id ( id, first_name, avatar_url, phone, instagram_id )
      )
    `,
    )
    .eq("event_id", eventData.value.id)
    .eq("status", "active")
    .order("departure_time", { ascending: true });

  if (data && !error) {
    rides.value = data;
  }
  loadingRides.value = false;
}

let fetchRidesTimeout: any = null;
function fetchRidesDebounced() {
  if (fetchRidesTimeout) clearTimeout(fetchRidesTimeout);
  fetchRidesTimeout = setTimeout(() => {
    fetchRides();
  }, 200);
}

function closeAllPanels() {
  selectedRide.value = null;
  profileSheetActive.value = false;
  pickingSheetActive.value = false;
  successSheetActive.value = false;
  isSheetMinimized.value = true;
}

function handleLogout() {
  auth.logout();
  router.push({ name: "auth" });
}

// ==========================================
// === 4. MAP & RIDES MANAGEMENT ===
// ==========================================
function initMap() {
  if (!mapContainer.value) return;

  // Fallback to Lille center if eventData is missing
  const lat = eventData.value?.center_lat || 43.5189;
  const lng = eventData.value?.center_lng || 1.8296;

  map = L.map(mapContainer.value, {
    center: [lat, lng],
    zoom: 13,
    zoomControl: false,
    attributionControl: false,
  });

  // Close all panels when clicking on the map
  map.on("click", () => {
    closeAllPanels();
  });

  // Premium minimalist tile layer (CartoDB Light)
  L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }
  ).addTo(map);

  // Initialize layer group for routes
  routeLayer = L.layerGroup().addTo(map);

  // Initialize marker cluster group with safety check
  // Initialize marker layer group (Story 4.2.2)
  markerLayerGroup = L.layerGroup().addTo(map);

  // Epicenter Marker (Story 2.1)
  const epicenterIcon = L.divIcon({
    className: "epicenter-marker-wrapper",
    html: `
      <div class="epicenter-pulse"></div>
      <div class="epicenter-dot">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-2.5 h-2.5 text-white">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001z" />
        </svg>
      </div>
      <div class="epicenter-label">
        Vendibringue 2026
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  epicenterMarker = L.marker([lat, lng], {
    icon: epicenterIcon,
    interactive: true,
    zIndexOffset: -100,
  }).addTo(map);

  epicenterMarker.on("click", () => {
    copyCoordinates();
    closeAllPanels();
  });

  // Update ride markers
  updateMarkers();
}

const markers = ref<Map<string, L.Marker>>(new Map());
const markerFingerprints = new Map<string, string>();

function updateMarkers() {
  if (!map || !markerLayerGroup) return;

  const data = visibleRidesMarkerData.value;
  const currentZoom = map.getZoom();
  const isSimplified = false; // Always show full bubbles as requested

  // 1. Remove markers for rides that are no longer active
  const activeIds = new Set(data.map((r) => r.id));
  markers.value.forEach((marker, id) => {
    if (!activeIds.has(id)) {
      if (markerLayerGroup) markerLayerGroup.removeLayer(marker);
      markers.value.delete(id);
      markerFingerprints.delete(id);
    }
  });

  // 2. Add or update markers for current rides
  data.forEach((ride) => {
    const isUserRide = ride.isUserRide;
    const seatsLeft = ride.seatsLeft;

    if (seatsLeft <= 0 && !isUserRide) {
      if (markers.value.has(ride.id)) {
        const m = markers.value.get(ride.id);
        if (m) markerLayerGroup!.removeLayer(m);
        markers.value.delete(ride.id);
        markerFingerprints.delete(ride.id);
      }
      return;
    }

    // === FINE-GRAINED UPDATE ===
    const fingerprint = `${ride.id}|${ride.lat}|${ride.lng}|${seatsLeft}|${isUserRide}|${ride.first_name}|${ride.avatar_url}`;
    const hasExisting = markers.value.has(ride.id);
    const prevFingerprint = markerFingerprints.get(ride.id);

    if (hasExisting && prevFingerprint === fingerprint) return;

    let icon: L.DivIcon;

    if (isSimplified && !isUserRide) {
      // Small dot for simplified view
      icon = L.divIcon({
        className: "car-marker-simplified-wrapper",
        html: `<div class="car-dot ${isUserRide ? 'is-user' : ''}"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
    } else {
      // Full bubble icon
      icon = L.divIcon({
        className: "car-marker-wrapper",
        html: `
          <div class="car-marker group ${isUserRide ? 'is-user-ride' : ''}">
            <div class="car-bubble group-active:scale-90 transition-transform bg-white" style="${
              isUserRide
                ? "border-color: var(--color-brand-accent); box-shadow: 0 8px 25px color-mix(in srgb, var(--color-brand-accent) 40%, transparent);"
                : "border-color: var(--color-brand-primary); box-shadow: 0 8px 25px color-mix(in srgb, var(--color-brand-primary) 40%, transparent);"
            }">
              <div class="w-full h-full rounded-full overflow-hidden">
                 <img src="${getAvatarUrl(ride.avatar_url)}" class="w-full h-full object-cover" loading="lazy" />
              </div>
              <div class="seats-badge">${seatsLeft}</div>
            </div>
            <div class="car-label" style="${
              isUserRide
                ? "border-color: color-mix(in srgb, var(--color-brand-accent) 20%, transparent); color: var(--color-brand-accent);"
                : ""
            }">${ride.first_name || "???"}</div>
            <div class="car-pointer"></div>
          </div>
        `,
        iconSize: [50, 60],
        iconAnchor: [25, 55],
      });
    }

    if (hasExisting) {
      const marker = markers.value.get(ride.id);
      marker?.setLatLng([ride.lat, ride.lng]);
      marker?.setIcon(icon);
    } else {
      const marker = L.marker([ride.lat, ride.lng], {
        icon: icon,
      });

      marker.on("click", () => {
        const fullRide = rides.value.find((r) => r.id === ride.id);
        if (fullRide) {
          selectedRide.value = fullRide;
          if (fullRide.driver_id === auth.user?.id) {
            currentTab.value = "driver";
          } else {
            currentTab.value = "passenger";
          }
          isSheetMinimized.value = false;
        }
      });

      markerLayerGroup!.addLayer(marker);
      markers.value.set(ride.id, marker);
    }
    
    markerFingerprints.set(ride.id, fingerprint);
  });
}



async function updateRouteLine(ride: any) {
  if (!map || !eventData.value || !routeLayer) return;

  const currentRideId = ride.id;
  const startLat = ride.origin_lat;
  const startLng = ride.origin_lng;
  const endLat = eventData.value.center_lat;
  const endLng = eventData.value.center_lng;

  const isUserRide = ride.driver_id === auth.user?.id || isPassenger(ride.id);
  const routeColor = isUserRide ? "#4285f4" : "#006a45";

  // 1. Check if already on map (Update color only)
  const existingLayers = routeLayer.getLayers();
  const existingPolyline = existingLayers.find(
    (l) => l instanceof L.Polyline && (l as any).rideId === currentRideId,
  ) as L.Polyline | undefined;

  if (existingPolyline) {
    const p = existingPolyline.getLatLngs() as L.LatLng[];
    const firstPoint = Array.isArray(p[0]) ? (p[0][0] as L.LatLng) : p[0];

    if (
      firstPoint &&
      Math.abs(firstPoint.lat - startLat) < 0.0001 &&
      Math.abs(firstPoint.lng - startLng) < 0.0001
    ) {
      existingPolyline.setStyle({ color: routeColor });
      return;
    }
  }

  // 2. Check Persistent Cache (localStorage)
  const cachedCoords = getRouteFromCache(currentRideId, startLat, startLng);
  if (cachedCoords) {
    if (!selectedRide.value || selectedRide.value.id !== currentRideId) return;
    
    routeLayer.clearLayers();
    const polyline = L.polyline(cachedCoords, {
      color: routeColor,
      weight: 6,
      opacity: 0.8,
      lineJoin: "round",
    }).addTo(routeLayer);

    (polyline as any).rideId = currentRideId;
    map.fitBounds(polyline.getBounds(), {
      paddingTopLeft: [40, 80],
      paddingBottomRight: [40, Math.min(window.innerHeight * 0.6, 500)],
      animate: true,
      duration: 1.5,
    });
    return;
  }

  // 3. Fetch from OSRM
  try {
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
    );
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      if (!selectedRide.value || selectedRide.value.id !== currentRideId) return;

      const coordinates = data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]],
      );

      // Save to Cache
      saveRouteToCache(currentRideId, startLat, startLng, coordinates);

      routeLayer.clearLayers();
      const polyline = L.polyline(coordinates, {
        color: routeColor,
        weight: 6,
        opacity: 0.8,
        lineJoin: "round",
      }).addTo(routeLayer);

      (polyline as any).rideId = currentRideId;
      map.fitBounds(polyline.getBounds(), {
        paddingTopLeft: [40, 80],
        paddingBottomRight: [40, Math.min(window.innerHeight * 0.6, 500)],
        animate: true,
        duration: 1.5,
      });
    } else {
      throw new Error("No route found");
    }
  } catch (err) {
    if (!selectedRide.value || selectedRide.value.id !== currentRideId) return;

    routeLayer.clearLayers();
    const fallbackPolyline = L.polyline(
      [
        [startLat, startLng],
        [endLat, endLng],
      ],
      {
        color: routeColor,
        weight: 6,
        opacity: 0.6,
        dashArray: "10, 10",
      },
    ).addTo(routeLayer);

    (fallbackPolyline as any).rideId = currentRideId;
    map.fitBounds(fallbackPolyline.getBounds(), {
      paddingTopLeft: [40, 80],
      paddingBottomRight: [40, Math.min(window.innerHeight * 0.6, 500)],
      animate: true,
      duration: 1.5,
    });
  }
}

watch(selectedRide, (newRide) => {
  if (newRide) {
    if (newRide.driver_id !== auth.user?.id) {
      isSheetMinimized.value = true; // Minimize main sheet to clear view for passenger detail
    }
    updateRouteLine(newRide);
  } else {
    // Clear route layer when closed
    if (routeLayer) {
      routeLayer.clearLayers();
    }
    // We no longer automatically re-zoom to center when closing to respect user navigation
  }
});

// ==========================================
// === 5. USER ACTIONS & UI ===
// ==========================================
async function openProfile() {
  profileSheetActive.value = true;
  profileLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("first_name, phone, instagram_id")
      .eq("id", auth.user?.id)
      .single();

    if (data && !error) {
      editedProfile.value = {
        first_name: data.first_name || "",
        phone: data.phone || "",
        instagram_id: data.instagram_id || "",
      };
    }
  } catch (err) {
    console.error("Error fetching profile:", err);
  } finally {
    profileLoading.value = false;
  }
}

async function updateProfile() {
  if (!auth.user?.id) return;
  profileLoading.value = true;

  try {
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: editedProfile.value.first_name,
        phone: editedProfile.value.phone,
        instagram_id: editedProfile.value.instagram_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", auth.user.id);

    if (error) throw error;

    // Update local store too
    if (auth.user) {
      auth.user.first_name = editedProfile.value.first_name;
      auth.user.phone = editedProfile.value.phone;
    }

    profileSheetActive.value = false;
    fetchRides(); // Refresh to see changes if we are a driver
  } catch (err: any) {
    alert("Erreur lors de la mise à jour : " + err.message);
  } finally {
    profileLoading.value = false;
  }
}

async function changeAvatar(index: number) {
  if (!auth.user?.id) return;
  const indexStr = String(index);

  try {
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: indexStr })
      .eq("id", auth.user.id);

    if (error) throw error;

    // Update local store
    if (auth.user) {
      auth.user.avatar_url = indexStr;

      // Update localStorage
      const stored = localStorage.getItem("vb_auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.user.avatar_url = indexStr;
        localStorage.setItem("vb_auth", JSON.stringify(parsed));
      }
    }

    isAvatarPickerOpen.value = false;
  } catch (err: any) {
    alert("Erreur lors du changement d'avatar : " + err.message);
  }
}

function getWhatsAppLink(phone: string) {
  // Remove spaces and +
  const clean = phone.replace(/[^0-9]/g, "");
  // If starts with 0 and 10 digits, assume FR (+33)
  const formatted =
    clean.length === 10 && clean.startsWith("0")
      ? "33" + clean.slice(1)
      : clean;
  return `https://wa.me/${formatted}`;
}

function startPicking() {
  if (myRide.value) {
    showBookingError("Tu as déjà un covoit en cours !");
    return;
  }
  if (myBookedRides.value.length > 0) {
    showBookingError(
      "Tu as déjà une réservation en cours ! Libère ta place avant de proposer un trajet.",
    );
    return;
  }
  closeAllPanels();
  // Clear previous data
  newRide.value.origin_name = "";
  newRide.value.total_seats = 3;
  newRide.value.departure_time = "20:00";
  isEditing.value = false;
  editingRideId.value = null;

  isPickingLocation.value = true;
  currentTab.value = "explorer"; // ensure we see the map
}

function cancelPicking() {
  isPickingLocation.value = false;
  pickingSheetActive.value = false;
  isSheetMinimized.value = false;
}

async function confirmLocation() {
  if (!map) return;
  const center = map.getCenter();
  pickedCoords.value = { lat: center.lat, lng: center.lng };

  // Set initial loading state for address
  newRide.value.origin_name = "Chargement de l'adresse...";

  isPickingLocation.value = false;
  pickingSheetActive.value = true;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "fr", // Prefer French addresses
        },
      },
    );
    const data = await response.json();
    if (data && data.address) {
      const a = data.address;
      // Get the most relevant local name (City, Town, Village)
      const locationName =
        a.city || a.town || a.village || a.municipality || a.suburb || "";
      newRide.value.origin_name = locationName || "Lieu sélectionné";
    } else {
      newRide.value.origin_name = "Lieu sélectionné";
    }
  } catch (error) {
    console.error("Geocoding failed:", error);
    newRide.value.origin_name = "Lieu sélectionné";
  }
}

async function submitRide() {
  if (!pickedCoords.value || !eventData.value) return;

  if (myRide.value && !isEditing.value) {
    showBookingError("Tu as déjà un covoit en cours !");
    return;
  }

  if (myBookedRides.value.length > 0 && !isEditing.value) {
    showBookingError(
      "Tu as déjà une réservation en cours ! Libère ta place avant de proposer un trajet.",
    );
    return;
  }

  // Create an ISO string for today + selected time (handling local timezone)
  const [hours, minutes] = newRide.value.departure_time.split(":").map(Number);
  const departureDate = new Date();
  departureDate.setHours(hours, minutes, 0, 0);
  const departureStr = departureDate.toISOString();

  const rideData = {
    event_id: eventData.value.id,
    driver_id: auth.user?.id,
    origin_name: newRide.value.origin_name || "Ma position",
    origin_lat: pickedCoords.value.lat,
    origin_lng: pickedCoords.value.lng,
    total_seats: newRide.value.total_seats,
    departure_time: departureStr,
  };

  let error;
  if (isEditing.value && editingRideId.value) {
    const { error: err } = await supabase
      .from("rides")
      .update(rideData)
      .eq("id", editingRideId.value);
    error = err;
  } else {
    const { error: err } = await supabase.from("rides").insert(rideData);
    error = err;
  }

  if (error) {
    if (error.code === "23505") {
      showBookingError("Tu as déjà un trajet actif !");
    } else {
      alert("Erreur : " + error.message);
    }
  } else {
    pickingSheetActive.value = false;
    isEditing.value = false;
    editingRideId.value = null;
    currentRole.value = "driver"; // just in case
  }
}

async function deleteRide(rideId: string) {
  rideToDeleteId.value = rideId;
  showDeleteRideConfirm.value = true;
}

async function confirmDeleteRide() {
  if (!rideToDeleteId.value) return;

  const { error } = await supabase
    .from("rides")
    .delete()
    .eq("id", rideToDeleteId.value);

  if (error) {
    alert("Erreur lors de la suppression : " + error.message);
  } else {
    selectedRide.value = null;
    showDeleteRideConfirm.value = false;
    rideToDeleteId.value = null;
  }
}

function editRide(ride: any) {
  isEditing.value = true;
  editingRideId.value = ride.id;
  newRide.value = {
    origin_name: ride.origin_name,
    total_seats: ride.total_seats,
    departure_time: formatTimeOnly(ride.departure_time),
  };
  pickedCoords.value = { lat: ride.origin_lat, lng: ride.origin_lng };
  selectedRide.value = null;
  pickingSheetActive.value = true;
}

function formatTimeOnly(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

async function removeParticipant(bookingId: string) {
  bookingToRemoveId.value = bookingId;
  showRemoveParticipantConfirm.value = true;
}

async function confirmRemoveParticipant() {
  if (!bookingToRemoveId.value) return;

  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingToRemoveId.value);

  if (error) {
    alert("Erreur lors du retrait : " + error.message);
  } else {
    showRemoveParticipantConfirm.value = false;
    bookingToRemoveId.value = null;
    // Update selectedRide locally to refresh the UI
    if (selectedRide.value && selectedRide.value.bookings) {
      selectedRide.value.bookings = selectedRide.value.bookings.filter(
        (b: any) => b.id !== bookingToRemoveId.value,
      );
    }
  }
}

function isPassenger(rideId: string) {
  const ride = rides.value.find((r: any) => r.id === rideId);
  if (!ride || !auth.user) return false;
  return (
    ride.bookings?.some((b: any) => b.passenger_id === auth.user?.id) || false
  );
}

async function confirmBooking(rideId: string) {
  if (!rideId || !auth.user) return;

  // Restored constraints: No multiple bookings or hosting + booking
  if (myRide.value) {
    showBookingError("Tu as déjà un covoit en cours !");
    return;
  }

  if (myBookedRides.value.length > 0) {
    showBookingError(
      "Tu as déjà une réservation en cours ! Libère ta place avant d'en réserver une autre.",
    );
    return;
  }

  try {
    bookingLoading.value = true;

    // 1. Optimistic Update in master list
    const rideIndex = rides.value.findIndex((r) => r.id === rideId);
    if (rideIndex !== -1 && auth.user) {
      const ride = rides.value[rideIndex];
      const newBooking = {
        id: "temp-" + Date.now(),
        passenger_id: auth.user.id,
        status: "confirmed",
        profiles: {
          id: auth.user.id,
          first_name: auth.user.first_name || "Moi",
          avatar_url: auth.user.avatar_url,
          phone: auth.user.phone,
          instagram_id: auth.user.instagram_id,
        },
      };
      const updatedBookings = [...(ride.bookings || []), newBooking];
      rides.value[rideIndex] = { ...ride, bookings: updatedBookings };
      rides.value = [...rides.value]; // Triggers the sync watcher
    }

    // 2. Supabase Call
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        ride_id: rideId,
        passenger_id: auth.user.id,
      })
      .select(
        `
        id, 
        passenger_id, 
        status,
        profiles:passenger_id ( id, first_name, avatar_url, phone, instagram_id )
      `,
      )
      .single();

    if (error) throw error;

    // 3. Replace temp with real data (already handled by fetchRides, but let's be thorough for sync)
    // Actually our watcher will keep selectedRide in sync as soon as rides updates.

    // Save info for success screen
    lastBookedRide.value = rides.value.find((r: any) => r.id === rideId);
    successSheetActive.value = true;

    // DELICIOUS CONFETTI
    const duration = 1 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 75,
        origin: { x: 0, y: 0.8 },
        colors: ["#ff4b4b", "#ff9f43", "#feca57"], // Red, Orange, Yellow
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 75,
        origin: { x: 1, y: 0.8 },
        colors: ["#ff4b4b", "#ff9f43", "#feca57"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  } catch (err: any) {
    console.error("Booking failed:", err);
    alert("Erreur lors de la réservation : " + err.message);
    fetchRidesDebounced(); // Rollback to real data safely
  } finally {
    bookingLoading.value = false;
  }
}

// Unused - consolidate into confirmBooking
// async function bookSeat() { ... }

function promptCancelBooking(rideId: string) {
  rideToCancel.value = rideId;
  showCancelConfirm.value = true;
}

async function confirmCancelBooking() {
  if (!rideToCancel.value || !auth.user) return;

  try {
    bookingLoading.value = true;
    const rideId = rideToCancel.value;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("ride_id", rideId)
      .eq("passenger_id", auth.user.id);

    if (error) throw error;

    // Optimistic UI update
    const rideIndex = rides.value.findIndex((r) => r.id === rideId);
    if (rideIndex !== -1 && auth.user) {
      const ride = rides.value[rideIndex];
      const updatedBookings = (ride.bookings || []).filter(
        (b: any) => b.passenger_id !== auth.user!.id,
      );
      rides.value[rideIndex] = { ...ride, bookings: updatedBookings };
      rides.value = [...rides.value]; // Triggers sync watcher
    }

    showCancelConfirm.value = false;
    rideToCancel.value = null;
  } catch (err: any) {
    console.error("Cancellation failed:", err);
    alert("Erreur lors de l'annulation : " + err.message);
    fetchRidesDebounced();
  } finally {
    bookingLoading.value = false;
  }
}

function closeCancelConfirm() {
  showCancelConfirm.value = false;
  rideToCancel.value = null;
}

async function installApp() {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    if (outcome === "accepted") {
      showInstallBanner.value = false;
      deferredPrompt.value = null;
    }
  } else if (isIOS.value) {
    profileSheetActive.value = false;
    showIOSInstructions.value = true;
    showInstallBanner.value = false;
  } else if (isAndroid.value) {
    profileSheetActive.value = false;
    showAndroidInstructions.value = true;
    showInstallBanner.value = false;
  }
}

function dismissInstallBanner() {
  showInstallBanner.value = false;
  localStorage.setItem("vb_install_dismissed", "true");
}

function locateMe() {
  if (!map) return;
  map.locate({ setView: true, maxZoom: 15 });
  map.once("locationfound", (e) => {
    userCoords.value = { lat: e.latlng.lat, lng: e.latlng.lng };
    if (userMarker) {
      userMarker.setLatLng(e.latlng);
    } else {
      userMarker = L.circleMarker(e.latlng, {
        radius: 8,
        color: "#fff",
        weight: 3,
        fillColor: "#4285F4",
        fillOpacity: 1,
      }).addTo(map!);
    }
  });
}

function recenter() {
  if (!map || !eventData.value) return;
  map.flyTo([eventData.value.center_lat, eventData.value.center_lng], 14);
}

// ==========================================
// === 6. REALTIME SUBSCRIPTIONS ===
// ==========================================
function setupRealtime() {
  realtimeChannel = supabase
    .channel("rides_updates")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rides" },
      () => {
        fetchRidesDebounced();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      () => {
        fetchRidesDebounced();
      },
    )
    .subscribe();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ==========================================
// === 7. VUE LIFECYCLE ===
// ==========================================
// Watch for rides changes to update markers
watch(
  rides,
  () => {
    updateMarkers();
  },
  { deep: true },
);

onMounted(async () => {
  checkPWAStatus();
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
    if (!isStandalone.value && !localStorage.getItem("vb_install_dismissed")) {
      setTimeout(() => {
        showInstallBanner.value = true;
      }, 3000);
    }
  });

  if (
    isIOS.value &&
    !isStandalone.value &&
    !localStorage.getItem("vb_install_dismissed")
  ) {
    setTimeout(() => {
      showInstallBanner.value = true;
    }, 4000);
  }

  // Fetch event data first to center the map correctly
  await fetchEventData();
  initMap();
  locateMe();

  // Fetch rides after map is ready
  fetchRides();
  setupRealtime();
});

onUnmounted(() => {
  window.removeEventListener("online", updateOnlineStatus);
  window.removeEventListener("offline", updateOnlineStatus);
  if (map) map.remove();
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
  }
});
</script>

<!-- ========================================== -->
<!-- === 8. INTERFACE (TEMPLATE) === -->
<!-- ========================================== -->
<template>
  <div
    class="h-[100dvh] flex flex-col relative overflow-hidden bg-brand-surface font-body"
  >
    <!-- Offline Banner -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="-translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="-translate-y-full"
    >
      <div
        v-if="isOffline"
        class="fixed top-0 inset-x-0 z-[100] bg-brand-on-surface text-brand-surface py-2 px-4 flex items-center justify-center gap-2 text-[10px] font-black shadow-lg"
      >
        <span class="material-symbols-outlined text-[14px] animate-pulse"
          >cloud_off</span
        >
        MODE HORS-LIGNE
      </div>
    </Transition>

    <!-- PWA Install Banner -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showInstallBanner && !isStandalone"
        class="fixed top-20 inset-x-4 z-[90] flex justify-center"
      >
        <div
          class="bg-[#4285F4] text-white p-4 rounded-[24px] shadow-2xl flex flex-col gap-3 relative overflow-hidden group max-w-sm w-full"
        >
          <div class="flex items-start gap-3">
            <div
              class="size-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0"
            >
              <span class="material-symbols-outlined text-white">download</span>
            </div>
            <div>
              <p class="text-sm font-black leading-tight mb-1">
                Garde VendiCovoit sous la main !
              </p>
              <p class="text-[11px] font-bold text-white/80 leading-snug">
                Installe l'app sur ton écran d'accueil pour un accès
                ultra-rapide et ne rater aucune place.
              </p>
            </div>
            <button
              @click="dismissInstallBanner"
              class="absolute top-2 right-2 size-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <button
            @click="installApp"
            class="w-full py-3 bg-white text-[#4285F4] font-black text-sm rounded-xl active:scale-95 transition-all shadow-lg"
          >
            Installer maintenant
          </button>
        </div>
      </div>
    </Transition>

    <!-- Booking Error Toast -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-[-100%] opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="bookingError"
        class="fixed top-6 inset-x-6 z-[200] flex justify-center pointer-events-none"
      >
        <div
          class="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20 backdrop-blur-md font-bold max-w-sm w-full pointer-events-auto shadow-red-500/20"
        >
          <span class="material-symbols-outlined">error_outline</span>
          <p class="text-sm font-black">{{ bookingError }}</p>
        </div>
      </div>
    </Transition>
    <!-- Top Bar -->
    <header
      class="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-brand-outline/20"
    >
      <div
        class="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto"
      >
        <div
          @click="copyCoordinates"
          class="flex items-center gap-3 cursor-pointer active:scale-95 transition-all group"
          title="Copier les coordonnées"
        >
          <h1
            class="text-xl font-extrabold tracking-tight text-brand-primary font-display"
          >
            VendiCovoit
          </h1>
        </div>

        <button
          @click="openProfile"
          class="size-10 rounded-full bg-brand-on-surface/[0.03] border border-brand-outline/10 flex items-center justify-center overflow-hidden hover:bg-brand-on-surface/[0.06] transition-colors"
        >
          <img
            :src="getAvatarUrl(auth.user?.avatar_url)"
            class="relative z-10 bg-brand-surface"
            alt="Profile Avatar"
          />
        </button>
      </div>
    </header>

    <!-- Copy Success Toast -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div
        v-if="copySuccess"
        class="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] bg-brand-on-surface text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-black text-sm"
      >
        <span class="material-symbols-outlined text-green-400"
          >content_copy</span
        >
        Coordonnées copiées !
      </div>
    </Transition>

    <!-- Map -->
    <!-- Map -->
    <div
      ref="mapContainer"
      class="absolute inset-0 z-[1] bg-brand-surface h-full w-full"
    ></div>

    <!-- Loading Overlay -->
    <div
      v-if="isEventLoading"
      class="absolute inset-0 z-[100] bg-brand-surface flex flex-col items-center justify-center p-6 text-center"
    >
      <div
        class="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"
      ></div>
      <p class="text-brand-on-surface/60 font-medium">
        Chargement de la Vendibringue...
      </p>
    </div>

    <!-- Error Overlay -->
    <div
      v-if="fetchError"
      class="absolute inset-0 z-[101] bg-brand-surface flex flex-col items-center justify-center p-6 text-center"
    >
      <span class="material-symbols-rounded text-5xl text-red-500 mb-4 italic"
        >error</span
      >
      <h3 class="text-xl font-black mb-2">{{ fetchError }}</h3>
      <p class="text-brand-on-surface/60 mb-6 max-w-xs">
        Vérifiez votre connexion ou contactez un organisateur.
      </p>
      <button
        @click="fetchEventData"
        class="px-8 py-4 bg-brand-primary text-white rounded-2xl font-black shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
      >
        Réessayer
      </button>
    </div>

    <!-- Map Picking UI (Story 1.1) -->
    <div
      v-if="isPickingLocation"
      class="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
    >
      <div class="relative">
        <div class="w-12 h-12 flex items-center justify-center -translate-y-6">
          <div class="w-0.5 h-12 bg-[#4285F4] absolute"></div>
          <div class="w-12 h-0.5 bg-[#4285F4] absolute"></div>
          <div
            class="w-4 h-4 rounded-full border-4 border-[#4285F4] absolute bg-white shadow-xl"
          ></div>
        </div>
      </div>
    </div>

    <!-- Confirm Location Button -->
    <div
      v-if="isPickingLocation"
      class="fixed bottom-12 left-0 w-full z-50 px-6 animate-in slide-in-from-bottom-5"
    >
      <div class="max-w-md mx-auto flex gap-3">
        <button
          @click="cancelPicking"
          class="flex-1 py-4 bg-white text-brand-on-surface font-bold rounded-2xl border border-brand-outline/20 shadow-xl pointer-events-auto active:scale-95 transition-all"
        >
          Annuler
        </button>
        <button
          @click="confirmLocation"
          class="flex-[2] py-4 bg-[#4285F4] text-white font-black text-lg rounded-2xl shadow-2xl shadow-[#4285F4]/30 pointer-events-auto active:scale-95 transition-all"
        >
          Partir d'ici
        </button>
      </div>
    </div>

    <!-- Map Tools -->
    <div class="fixed top-24 right-5 flex flex-col gap-3 z-10">
      <button
        @click="recenter"
        class="w-11 h-11 bg-brand-primary text-white border border-brand-primary/20 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all"
        title="Centrer sur la fête"
      >
        <span class="material-symbols-outlined text-[20px]">location_on</span>
      </button>
      <button
        @click="locateMe"
        class="w-11 h-11 bg-white border border-brand-outline/30 rounded-full flex items-center justify-center text-brand-on-surface shadow-xl active:scale-95 transition-all"
        title="Ma position"
      >
        <span class="material-symbols-outlined text-[20px]">my_location</span>
      </button>
    </div>

    <!-- Bottom Interface Wrapper -->
    <div
      v-if="!isPickingLocation && !pickingSheetActive"
      class="mt-auto relative z-40 pointer-events-none"
    >
      <!-- Bottom Sheet -->
      <section
        class="bg-white/80 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] border-t border-brand-outline/20 flex flex-col transition-all duration-500 overflow-hidden max-h-[75vh] pointer-events-auto"
        :class="[
          isDragging && activeDraggingSheet === 'explorer'
            ? 'transition-none'
            : '',
        ]"
        :style="{
          transform:
            isDragging && activeDraggingSheet === 'explorer'
              ? `translateY(calc(${isSheetMinimized ? '100% - 40px' : '0'} + ${dragTranslateY}px))`
              : isSheetMinimized
                ? 'translateY(calc(100% - 40px))'
                : 'translateY(0)',
        }"
      >
        <!-- Drag Handle / Grabber -->
        <div
          @click="isSheetMinimized = !isSheetMinimized"
          @touchstart="onSheetDragStart($event, 'explorer')"
          @touchmove="onSheetDragMove"
          @touchend="onSheetDragEnd"
          class="w-full py-4 cursor-pointer active:bg-black/5 transition-colors group"
        >
          <div
            class="w-10 h-1.5 bg-brand-on-surface/10 rounded-full mx-auto group-active:bg-brand-on-surface/20 transition-colors"
          ></div>
        </div>

        <!-- Role Toggle (Story 1.3) -->
        <div class="px-6 py-4">
          <div
            class="bg-brand-on-surface/[0.04] p-1.5 rounded-full flex gap-1.5 w-full max-w-sm mx-auto shadow-inner"
          >
            <button
              @click="currentRole = 'passenger'"
              class="flex-1 py-2.5 px-4 rounded-full text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-300"
              :class="
                currentRole === 'passenger'
                  ? 'bg-white text-brand-primary shadow-md scale-[1.02]'
                  : 'text-brand-on-surface/40'
              "
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
                />
              </svg>
              Je cherche
            </button>
            <button
              @click="currentRole = 'driver'"
              class="flex-1 py-2.5 px-4 rounded-full text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-300"
              :class="
                currentRole === 'driver'
                  ? 'bg-white text-[#4285F4] shadow-md scale-[1.02]'
                  : 'text-brand-on-surface/40'
              "
            >
              <svg
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
                />
              </svg>
              Je propose
            </button>
          </div>
        </div>

        <!-- Dynamic Content List -->
        <div class="px-6 pb-6 pt-2 overflow-y-auto max-h-[50vh]">
          <div class="flex justify-between items-center mb-6">
            <h2
              class="text-2xl font-black tracking-tight text-brand-on-surface"
            >
              {{
                currentRole === "passenger"
                  ? "Trajets à proximité"
                  : "Gérer ton covoit"
              }}
            </h2>
          </div>

          <!-- Passenger List -->
          <template v-if="currentRole === 'passenger'">
            <div v-if="loadingRides" class="py-12 flex justify-center">
              <div
                class="w-8 h-8 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin"
              ></div>
            </div>

            <div v-else class="space-y-8">
              <!-- Available Rides -->
              <div v-if="availableRides.length > 0">
                <div class="space-y-4">
                  <div
                    v-for="ride in availableRides"
                    :key="ride.id"
                    @click="selectedRide = ride"
                    :class="[
                      'p-5 rounded-[2.5rem] flex items-center gap-5 hover:shadow-xl transition-all cursor-pointer group active:scale-[0.98]',
                      isPassenger(ride.id)
                        ? 'bg-white border-2 border-[#4285F4] shadow-md shadow-[#4285F4]/10'
                        : 'bg-white border border-brand-outline/30 hover:border-brand-primary/20',
                    ]"
                  >
                    <div class="relative flex-shrink-0">
                      <div
                        v-if="isPassenger(ride.id)"
                        class="w-16 h-16 rounded-[1.5rem] bg-[#4285F4] text-white flex items-center justify-center shadow-lg shadow-[#4285F4]/20"
                      >
                        <span class="material-symbols-outlined text-2xl"
                          >directions_car</span
                        >
                      </div>
                      <div
                        v-else
                        class="w-16 h-16 rounded-full bg-brand-primary/5 flex items-center justify-center border border-brand-outline/20 overflow-hidden group-hover:border-brand-primary/30 transition-colors"
                      >
                        <img
                          v-if="ride.profiles?.avatar_url"
                          :src="getAvatarUrl(ride.profiles.avatar_url)"
                          class="w-full h-full object-cover"
                        />
                        <span
                          v-else
                          class="text-xl font-black text-brand-primary"
                        >
                          {{ ride.profiles?.first_name?.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-start mb-1">
                        <span
                          :class="[
                            'font-black text-lg',
                            isPassenger(ride.id)
                              ? 'text-[#4285F4]'
                              : 'text-brand-on-surface',
                          ]"
                        >
                          {{
                            isPassenger(ride.id)
                              ? formatTime(ride.departure_time)
                              : ride.profiles?.first_name
                          }}
                        </span>
                        <div class="flex items-center">
                          <span
                            v-if="!isPassenger(ride.id) && userCoords"
                            class="mr-3 text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full border border-brand-primary/10 flex items-center"
                          >
                            <span
                              class="material-symbols-outlined !text-[12px] mr-1 opacity-70"
                              >near_me</span
                            >
                            {{
                              getDistance(
                                userCoords.lat,
                                userCoords.lng,
                                ride.origin_lat,
                                ride.origin_lng,
                              ).toFixed(0)
                            }}
                            km
                          </span>
                          <span
                            v-if="!isPassenger(ride.id)"
                            class="text-brand-primary font-black text-lg"
                          >
                            {{ formatTime(ride.departure_time) }}
                          </span>
                          <span
                            v-if="isPassenger(ride.id)"
                            class="px-3 py-1 bg-[#4285F4]/5 text-[#4285F4] text-[10px] font-black uppercase tracking-widest rounded-full"
                            >Ton covoit</span
                          >
                        </div>
                      </div>
                      <div
                        class="flex items-center gap-2"
                        :class="isPassenger(ride.id) && 'mb-3'"
                      >
                        <span
                          class="text-sm font-bold text-brand-on-surface/60"
                          v-if="!isPassenger(ride.id)"
                        >
                          {{ getSeatsLeft(ride) }}
                          place{{ getSeatsLeft(ride) > 1 ? "s" : "" }}
                        </span>
                        <span
                          v-if="!isPassenger(ride.id)"
                          class="w-1 h-1 bg-brand-on-surface/20 rounded-full"
                        ></span>
                        <span
                          class="text-xs font-bold uppercase tracking-tighter"
                          :class="
                            isPassenger(ride.id)
                              ? 'text-brand-on-surface/40'
                              : 'text-brand-primary/70'
                          "
                          >{{ ride.origin_name }}</span
                        >
                      </div>
                      <!-- Add occupancy status when passenger, just like driver side -->
                      <div
                        v-if="isPassenger(ride.id)"
                        class="flex items-center gap-3 mt-1"
                      >
                        <div class="flex -space-x-2">
                          <div
                            v-for="i in Math.min(3, getBookedCount(ride))"
                            :key="i"
                            class="w-7 h-7 rounded-full bg-brand-outline/20 border-2 border-white flex items-center justify-center overflow-hidden"
                          >
                            <span
                              class="material-symbols-outlined text-[14px] text-brand-on-surface/40"
                              >person</span
                            >
                          </div>
                        </div>
                        <span
                          class="text-sm font-bold text-brand-on-surface/60"
                        >
                          {{ getBookedCount(ride) }} /
                          {{ ride.total_seats }} passagers
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- No Rides State -->
              <div
                v-else-if="myBookedRides.length === 0"
                class="py-12 text-center"
              >
                <div
                  class="w-20 h-20 bg-brand-on-surface/[0.03] rounded-3xl flex items-center justify-center mx-auto mb-4 border border-brand-outline/10"
                >
                  <svg
                    class="w-10 h-10 text-brand-on-surface/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p class="text-brand-on-surface/40 font-bold">
                  Aucun trajet pour le moment
                </p>
              </div>
            </div>
          </template>

          <!-- Driver UI -->
          <template v-else>
            <!-- Mon trajet proposé -->
            <div v-if="myRide" class="space-y-6">
              <div
                @click="editRide(myRide)"
                class="bg-white border-2 border-[#4285F4]/10 p-5 rounded-[2.5rem] flex items-center gap-5 hover:border-[#4285F4]/30 transition-all cursor-pointer relative group active:scale-[0.98]"
              >
                <!-- Visual Icon for Own Ride -->
                <div class="relative flex-shrink-0">
                  <div
                    class="w-16 h-16 rounded-[1.5rem] bg-[#4285F4] text-white flex items-center justify-center shadow-lg shadow-[#4285F4]/20"
                  >
                    <span class="material-symbols-outlined text-2xl"
                      >directions_car</span
                    >
                  </div>
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start mb-1">
                    <span class="text-[#4285F4] font-black text-lg">{{
                      formatTime(myRide.departure_time)
                    }}</span>
                    <span
                      class="px-3 py-1 bg-[#4285F4]/5 text-[#4285F4] text-[10px] font-black uppercase tracking-widest rounded-full"
                      >Ton covoit</span
                    >
                  </div>
                  <div class="flex items-center gap-2 mb-3">
                    <span
                      class="text-xs font-bold text-brand-on-surface/40 uppercase tracking-tighter"
                      >{{ myRide.origin_name }}</span
                    >
                  </div>

                  <!-- Occupancy status -->
                  <div class="flex items-center gap-3">
                    <div class="flex -space-x-2">
                      <div
                        v-for="i in Math.min(3, getBookedCount(myRide))"
                        :key="i"
                        class="w-7 h-7 rounded-full bg-brand-outline/20 border-2 border-white flex items-center justify-center overflow-hidden"
                      >
                        <span
                          class="material-symbols-outlined text-[14px] text-brand-on-surface/40"
                          >person</span
                        >
                      </div>
                    </div>
                    <span class="text-sm font-bold text-brand-on-surface/60">
                      {{
                        myRide.bookings?.filter(
                          (b: any) => b.status === "confirmed",
                        ).length || 0
                      }}
                      / {{ myRide.total_seats }} passagers
                    </span>
                  </div>
                </div>
                <button
                  @click.stop="deleteRide(myRide.id)"
                  class="absolute -bottom-2 -right-1 py-2 size-10 bg-[#FFF0F0] text-[#FF4B4B] rounded-full active:scale-95 transition-all border border-[#FF4B4B]/10 flex items-center justify-center"
                >
                  <span class="material-symbols-outlined !text-[18px]"
                    >delete</span
                  >
                </button>
              </div>

              <!-- Integrated Management Section -->
              <div class="space-y-6 px-1">
                <!-- Participants List -->
                <div>
                  <label
                    class="block text-[10px] font-black uppercase tracking-widest text-brand-on-surface/30 mb-4 px-1"
                  >
                    Passagers ({{ getBookedCount(myRide) }} /
                    {{ myRide.total_seats }})
                  </label>

                  <div
                    v-if="!myRide.bookings || myRide.bookings.length === 0"
                    class="py-8 bg-brand-on-surface/[0.02] rounded-3xl border border-dashed border-brand-outline/10 text-center"
                  >
                    <p
                      class="text-brand-on-surface/40 font-bold text-xs italic"
                    >
                      Aucune réservation pour le moment
                    </p>
                  </div>

                  <div v-else class="space-y-3">
                    <div
                      v-for="booking in myRide.bookings"
                      :key="booking.id"
                      class="flex items-center gap-4 p-4 bg-white rounded-2xl border border-brand-outline/10 shadow-sm transition-all hover:shadow-md"
                    >
                      <img
                        :src="getAvatarUrl(booking.profiles?.avatar_url)"
                        class="w-10 h-10 rounded-full bg-brand-surface object-cover border border-brand-outline/5"
                      />
                      <div class="flex-1 min-w-0">
                        <p
                          class="font-black text-sm text-brand-on-surface truncate"
                        >
                          {{ booking.profiles?.first_name }}
                        </p>
                        <a
                          v-if="booking.profiles?.phone"
                          :href="'sms:' + booking.profiles.phone"
                          class="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-all"
                        >
                          <span class="material-symbols-outlined !text-[12px]"
                            >sms</span
                          >
                          <p class="text-[10px] font-bold">
                            {{ booking.profiles?.phone }}
                          </p>
                        </a>
                        <div
                          v-else
                          class="flex items-center gap-1.5 opacity-40"
                        >
                          <span class="material-symbols-outlined !text-[12px]"
                            >block</span
                          >
                          <p class="text-[10px] font-bold">Pas de numéro</p>
                        </div>
                      </div>
                      <button
                        @click="removeParticipant(booking.id)"
                        class="w-10 h-10 flex items-center justify-center text-red-500 bg-red-50 rounded-xl transition-all active:scale-95"
                        title="Retirer le passager"
                      >
                        <span class="material-symbols-outlined !text-[18px]"
                          >person_remove</span
                        >
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Driver UI Placeholder (if no ride) -->
            <div v-else class="text-center">
              <div
                class="w-24 h-24 bg-brand-primary/5 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-brand-primary/20"
              >
                <span
                  class="material-symbols-outlined text-[48px] text-brand-primary/40"
                  >directions_car</span
                >
              </div>
              <h3 class="text-xl font-bold text-brand-on-surface mb-2">
                Pas encore de covoit proposé
              </h3>
              <p
                class="text-sm text-brand-on-surface/50 max-w-[280px] mx-auto mb-8"
              >
                Deviens le héros de la soirée en proposant des places dans ton
                carrosse !
              </p>
              <button
                @click="startPicking"
                class="w-full py-4 bg-[#4285F4] text-white font-black text-lg rounded-full shadow-2xl shadow-[#4285F4]/30 hover:shadow-[#4285F4]/40 active:scale-95 transition-all"
              >
                Proposer un covoit
              </button>
            </div>
          </template>
        </div>

        <!-- Event Location & Navigation (Moved to bottom) -->
        <div class="px-6 py-4 bg-white border-t border-brand-outline/10">
          <div
            class="flex items-center justify-between gap-4 p-4 bg-brand-on-surface/[0.03] rounded-[2rem] border border-brand-outline/10"
          >
            <div class="flex flex-col min-w-0">
              <span
                class="text-[10px] font-black text-brand-primary uppercase tracking-widest mb-0.5"
                >Destination</span
              >
              <h3 class="font-black text-sm truncate uppercase">
                {{ eventData.name }}
              </h3>
            </div>
            <div class="flex gap-2 shrink-0">
              <button
                @click="openNavigation('waze')"
                class="w-10 h-10 bg-white shadow-sm border border-brand-outline/10 rounded-xl flex items-center justify-center active:scale-90 transition-all group"
                title="Ouvrir dans Waze"
              >
                <img
                  src="https://img.icons8.com/color/48/waze.png"
                  class="w-6 h-6 transition-all"
                  alt="Waze"
                />
              </button>
              <button
                @click="openNavigation('google')"
                class="w-10 h-10 bg-white shadow-sm border border-brand-outline/10 rounded-xl flex items-center justify-center active:scale-90 transition-all group"
                title="Ouvrir dans Google Maps"
              >
                <img
                  src="https://img.icons8.com/color/48/google-maps-new.png"
                  class="w-6 h-6 transition-all"
                  alt="Gmaps"
                />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Ride Creation Sheet (Inspired by Airbnb) -->
    <Transition
      enter-active-class="transition duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition duration-400 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <section
        v-if="pickingSheetActive"
        class="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] border-t border-brand-outline/20 fixed inset-x-0 bottom-0 z-[60] flex flex-col transition-all duration-300"
        :style="{
          transform:
            isDragging && activeDraggingSheet === 'picking'
              ? `translateY(${dragTranslateY}px)`
              : '',
        }"
      >
        <!-- Drag Handle -->
        <div
          class="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing"
          @touchstart="onSheetDragStart($event, 'picking')"
          @touchmove="onSheetDragMove"
          @touchend="onSheetDragEnd"
        >
          <div class="w-10 h-1.5 bg-brand-on-surface/10 rounded-full"></div>
        </div>
        <div class="px-6 py-6 pb-12">
          <h2 class="text-2xl font-black mb-8">
            {{ isEditing ? "Modifier mon trajet" : "Derniers réglages" }}
          </h2>

          <!-- Origin Name Input -->
          <div class="mb-10">
            <label
              class="block text-[11px] font-black uppercase tracking-widest text-brand-on-surface/40 mb-3"
              >Lieu de départ (Nom)</label
            >
            <input
              v-model="newRide.origin_name"
              type="text"
              placeholder="Ex: Gare St Charles, Chez moi..."
              class="w-full p-4 bg-brand-on-surface/[0.03] border border-brand-outline/10 rounded-2xl font-bold text-lg focus:ring-2 focus:ring-brand-primary/20 outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-6 mb-12">
            <!-- Seats Selector -->
            <div>
              <label
                class="block text-[11px] font-black uppercase tracking-widest text-brand-on-surface/40 mb-3"
                >Places disponibles</label
              >
              <div
                class="flex items-center justify-between p-3 bg-brand-on-surface/[0.03] border border-brand-outline/10 rounded-2xl"
              >
                <button
                  @click="newRide.total_seats > 1 && newRide.total_seats--"
                  class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                  <span class="material-symbols-outlined text-[20px]"
                    >remove</span
                  >
                </button>
                <span class="text-xl font-black">{{
                  newRide.total_seats
                }}</span>
                <button
                  @click="newRide.total_seats < 10 && newRide.total_seats++"
                  class="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                >
                  <span class="material-symbols-outlined text-[20px]">add</span>
                </button>
              </div>
            </div>

            <!-- Time Picker -->
            <div>
              <label
                class="block text-[11px] font-black uppercase tracking-widest text-brand-on-surface/40 mb-3"
                >Heure du départ</label
              >
              <div class="relative">
                <input
                  v-model="newRide.departure_time"
                  type="time"
                  class="w-full p-4 bg-brand-on-surface/[0.03] border border-brand-outline/10 rounded-2xl font-black text-lg appearance-none outline-none"
                />
              </div>
            </div>
          </div>

          <div class="flex gap-4">
            <button
              @click="pickingSheetActive = false"
              class="flex-1 py-4 font-bold text-brand-on-surface/40"
            >
              Annuler
            </button>
            <button
              @click="submitRide"
              class="flex-[3] py-4 bg-[#4285F4] text-white font-black text-lg rounded-2xl shadow-2xl shadow-[#4285F4]/30 active:scale-95 transition-all"
            >
              {{
                isEditing
                  ? "Enregistrer les modifications"
                  : "Diffuser l'annonce"
              }}
            </button>
          </div>
        </div>
      </section>
    </Transition>

    <!-- Ride Details Sheet -->
    <Transition
      enter-active-class="transition duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition duration-400 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <section
        v-if="selectedRide && selectedRide.driver_id !== auth.user?.id"
        class="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] border-t border-brand-outline/20 fixed inset-x-0 bottom-0 z-[60] flex flex-col transition-all duration-300"
        :style="{
          transform:
            isDragging && activeDraggingSheet === 'selectedRide'
              ? `translateY(${dragTranslateY}px)`
              : '',
        }"
      >
        <!-- Drag Handle -->
        <div
          class="w-full flex justify-center py-4"
          @touchstart="onSheetDragStart($event, 'selectedRide')"
          @touchmove="onSheetDragMove"
          @touchend="onSheetDragEnd"
        >
          <div class="w-10 h-1.5 bg-brand-on-surface/10 rounded-full"></div>
        </div>

        <!-- PASSENGER VIEW -->
        <div class="px-6 pb-6">
          <div class="flex items-center gap-4 mb-8">
            <img
              :src="getAvatarUrl(selectedRide.profiles?.avatar_url)"
              class="w-16 h-16 rounded-full border-2 border-brand-primary bg-brand-on-surface/[0.05] object-cover"
              @error="
                (e) => ((e.target as HTMLImageElement).src = getAvatarUrl('1'))
              "
              alt="Driver Avatar"
            />
            <div>
              <h2 class="text-2xl font-black">
                {{ selectedRide.profiles?.first_name }}
              </h2>
              <div>
                <p class="text-brand-on-surface/50 font-bold flex items-center">
                  Part à
                  {{
                    new Date(selectedRide.departure_time).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )
                  }}
                </p>
                <div class="flex items-center justify-center overflow-x-auto">
                  <a
                    v-if="selectedRide.profiles?.phone"
                    :href="'sms:' + selectedRide.profiles.phone"
                    class="size-10 flex items-center justify-center active:scale-95 transition-all"
                    title="Envoyer un SMS"
                  >
                    <span class="material-symbols-outlined">sms</span>
                  </a>
                  <a
                    v-if="selectedRide.profiles?.phone"
                    :href="getWhatsAppLink(selectedRide.profiles.phone)"
                    target="_blank"
                    class="size-10 flex items-center justify-center active:scale-95 transition-all"
                    title="WhatsApp"
                  >
                    <img
                      src="https://img.icons8.com/color/48/whatsapp.png"
                      class="size-8"
                      alt="WhatsApp"
                    />
                  </a>
                  <a
                    v-if="selectedRide.profiles?.instagram_id"
                    :href="
                      'https://instagram.com/' +
                      selectedRide.profiles.instagram_id.replace('@', '')
                    "
                    target="_blank"
                    class="size-10 flex items-center justify-center active:scale-95 transition-all"
                    title="Instagram"
                  >
                    <img
                      src="https://img.icons8.com/color/48/instagram-new.png"
                      class="w-8 h-8"
                      alt="Instagram"
                    />
                  </a>
                </div>
              </div>
            </div>
            <div class="ml-auto text-right">
              <span class="text-3xl font-black text-brand-primary">
                {{ getSeatsLeft(selectedRide) }}
              </span>
              <p
                class="text-[10px] font-black uppercase text-brand-on-surface/40"
              >
                Place{{ getSeatsLeft(selectedRide) > 1 ? "s" : "" }}
              </p>
            </div>
          </div>

          <div class="bg-brand-on-surface/[0.03] p-5 rounded-2xl mb-8">
            <div class="flex items-center">
              <span class="material-symbols-outlined text-brand-primary mr-2"
                >location_on</span
              >
              <p class="font-bold">
                Départ :
                <span class="text-brand-on-surface/60">{{
                  selectedRide.origin_name
                }}</span>
              </p>
            </div>
          </div>

          <!-- Participants List -->
          <div class="mb-8">
            <label
              class="block text-[11px] font-black uppercase tracking-widest text-brand-on-surface/40 mb-4"
            >
              Passagers ({{ getBookedCount(selectedRide) }} /
              {{ selectedRide.total_seats }})
            </label>

            <div
              v-if="getBookedCount(selectedRide) === 0"
              class="py-6 bg-brand-on-surface/[0.02] rounded-2xl border border-dashed border-brand-outline/20 text-center"
            >
              <p class="text-brand-on-surface/40 font-bold text-xs italic">
                Soyez le premier à rejoindre !
              </p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="booking in selectedRide.bookings"
                :key="booking.id"
                class="flex items-center gap-3 p-3 bg-brand-on-surface/[0.03] rounded-2xl border border-brand-outline/10"
              >
                <img
                  :src="getAvatarUrl(booking.profiles?.avatar_url)"
                  class="w-8 h-8 rounded-full bg-brand-on-surface/[0.05] shadow-sm object-cover"
                  @error="
                    (e) =>
                      ((e.target as HTMLImageElement).src = getAvatarUrl('1'))
                  "
                />
                <div class="flex-1">
                  <p class="font-black text-sm text-brand-on-surface">
                    {{ booking.profiles?.first_name }}
                  </p>
                </div>
                <!-- Contact icons for participants -->
                <div class="flex gap-2">
                  <a
                    v-if="booking.profiles?.phone"
                    :href="getWhatsAppLink(booking.profiles.phone)"
                    target="_blank"
                    class="w-8 h-8 bg-white border border-brand-outline/5 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all"
                  >
                    <img
                      src="https://img.icons8.com/color/48/whatsapp.png"
                      class="w-5 h-5"
                      alt="WA"
                    />
                  </a>
                  <a
                    v-if="booking.profiles?.phone"
                    :href="'sms:' + booking.profiles.phone"
                    class="w-8 h-8 bg-white border border-brand-outline/5 rounded-xl flex items-center justify-center text-brand-on-surface shadow-sm active:scale-90 transition-all"
                  >
                    <span class="material-symbols-outlined !text-[18px]"
                      >sms</span
                    >
                  </a>
                  <a
                    v-if="booking.profiles?.instagram_id"
                    :href="
                      'https://instagram.com/' +
                      booking.profiles.instagram_id.replace('@', '')
                    "
                    target="_blank"
                    class="w-8 h-8 bg-white border border-brand-outline/5 rounded-xl flex items-center justify-center shadow-sm active:scale-90 transition-all"
                  >
                    <img
                      src="https://img.icons8.com/color/48/instagram-new.png"
                      class="w-5 h-5"
                      alt="IG"
                    />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="flex gap-4">
            <button
              @click="selectedRide = null"
              class="flex-1 py-4 font-bold text-brand-on-surface/40"
            >
              Fermer
            </button>
            <button
              v-if="
                selectedRide.driver_id !== auth.user?.id &&
                !isPassenger(selectedRide.id)
              "
              @click="confirmBooking(selectedRide.id)"
              :disabled="bookingLoading"
              class="flex-[3] py-4 bg-brand-primary text-white font-black text-lg rounded-2xl shadow-2xl shadow-brand-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <span
                v-if="bookingLoading"
                class="material-symbols-outlined animate-spin"
                >refresh</span
              >
              <span v-else>Réserver ma place</span>
            </button>
            <button
              v-else-if="isPassenger(selectedRide.id)"
              @click="promptCancelBooking(selectedRide.id)"
              :disabled="bookingLoading"
              class="flex-[3] py-4 bg-red-50 text-brand-error font-bold text-lg rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-brand-error/10"
            >
              <span
                v-if="bookingLoading"
                class="material-symbols-outlined animate-spin"
                >refresh</span
              >
              <template v-else>
                <span class="material-symbols-outlined !text-[20px]"
                  >cancel</span
                >
                Libérer ma place
              </template>
            </button>
          </div>
        </div>
      </section>
    </Transition>

    <!-- Profile Settings Panel (Right Side) -->
    <div class="fixed inset-0 pointer-events-none z-[74]">
      <!-- Backdrop -->
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="profileSheetActive"
          class="absolute inset-0 bg-brand-on-surface/20 backdrop-blur-sm pointer-events-auto"
          @click="profileSheetActive = false"
        ></div>
      </Transition>

      <!-- Panel -->
      <Transition
        enter-active-class="transition duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
        enter-from-class="translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transition duration-400 ease-in-out"
        leave-from-class="translate-x-0"
        leave-to-class="translate-x-full"
      >
        <section
          v-if="profileSheetActive"
          class="absolute top-0 right-0 h-full w-[85%] max-w-[360px] bg-white shadow-[-10px_0_40px_rgba(0,0,0,0.1)] border-l border-brand-outline/20 z-[75] flex flex-col pointer-events-auto"
        >
          <!-- Header -->
          <div class="px-6 py-6 flex items-center justify-between">
            <h2 class="text-xl font-black text-brand-on-surface">Mon Profil</h2>
            <button
              @click="profileSheetActive = false"
              class="w-10 h-10 rounded-full bg-brand-on-surface/[0.05] flex items-center justify-center active:scale-95 transition-all text-brand-on-surface/60"
            >
              <span class="material-symbols-outlined !text-[20px]">close</span>
            </button>
          </div>

          <div
            v-if="profileLoading"
            class="flex-1 flex items-center justify-center"
          >
            <div
              class="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"
            ></div>
          </div>

          <div v-else class="flex-1 overflow-y-auto px-6 pb-12 scrollbar-hide">
            <!-- Avatar Section -->
            <div class="flex flex-col items-center mt-4 mb-10">
              <div class="relative group">
                <div
                  class="absolute -inset-1 bg-brand-primary/20 rounded-full blur-md group-hover:bg-brand-primary/30 transition-all"
                ></div>
                <div
                  class="relative cursor-pointer"
                  @click="isAvatarPickerOpen = true"
                >
                  <img
                    :src="getAvatarUrl(auth.user?.avatar_url)"
                    class="size-24 rounded-full border-4 border-white shadow-xl relative z-10 bg-brand-on-surface/[0.05] object-cover"
                    @error="
                      (e) =>
                        ((e.target as HTMLImageElement).src = getAvatarUrl('1'))
                    "
                    alt="Profile Avatar"
                  />
                  <!-- Edit Icon overlay -->
                  <div
                    class="absolute bottom-1 right-1 size-8 bg-brand-primary text-white rounded-full border-4 border-white shadow-lg flex items-center justify-center z-20 active:scale-90 transition-all"
                  >
                    <span class="material-symbols-outlined !text-[20px]"
                      >edit</span
                    >
                  </div>
                </div>
              </div>
            </div>

            <!-- Informations Section -->
            <div class="space-y-3 mb-10">
              <!-- Prénom -->
              <div>
                <label
                  class="block text-[11px] font-black tracking-[0.15em] text-brand-on-surface/40 mb-3 ml-1 uppercase"
                >
                  Ton Prénom
                </label>
                <div
                  class="bg-brand-on-surface/[0.03] rounded-[22px] border border-brand-outline/10 p-1"
                >
                  <input
                    v-model="editedProfile.first_name"
                    class="w-full px-5 py-4 bg-transparent font-black text-brand-on-surface outline-none text-[16px] border-none"
                  />
                </div>
              </div>

              <!-- Tél -->
              <div>
                <label
                  class="block text-[11px] font-black tracking-[0.15em] text-brand-on-surface/40 mb-3 ml-1 uppercase"
                >
                  WhatsApp / Tél
                </label>
                <div
                  class="bg-brand-on-surface/[0.03] rounded-[22px] border border-brand-outline/10 p-1"
                >
                  <input
                    v-model="editedProfile.phone"
                    class="w-full px-5 py-4 bg-transparent font-black text-brand-on-surface outline-none text-[16px] border-none"
                  />
                </div>
              </div>

              <!-- Instagram -->
              <div>
                <label
                  class="block text-[11px] font-black tracking-[0.15em] text-brand-on-surface/40 mb-3 ml-1 uppercase"
                >
                  Instagram
                </label>
                <div
                  class="bg-brand-on-surface/[0.03] rounded-[22px] border border-brand-outline/10 p-1 flex items-center"
                >
                  <span
                    class="pl-5 pr-0.5 font-bold text-brand-on-surface/30 text-[16px]"
                    >@</span
                  >
                  <input
                    v-model="editedProfile.instagram_id"
                    class="w-full pr-5 py-4 bg-transparent font-black text-brand-on-surface outline-none text-[16px] border-none"
                  />
                </div>
              </div>
            </div>

            <!-- Save Changes Button if modified -->
            <button
              v-if="JSON.stringify(editedProfile) !== JSON.stringify(auth.user)"
              @click="updateProfile"
              class="w-full py-4 mb-4 bg-brand-primary text-white font-black text-lg rounded-[24px] shadow-xl shadow-brand-primary/20 active:scale-95 transition-all"
            >
              Enregistrer
            </button>

            <!-- PWA Install Button in Profile -->
            <button
              v-if="!isStandalone"
              @click="installApp"
              class="w-full py-4 mb-4 bg-brand-on-surface text-brand-surface font-black text-[15px] rounded-[24px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              <span class="material-symbols-outlined !text-[20px] font-bold"
                >mobile_friendly</span
              >
              Installer l'application
            </button>

            <!-- Logout Button -->
            <button
              @click="handleLogout"
              class="w-full py-4 bg-[#FFF0F0] text-[#FF4B4B] font-black text-[15px] rounded-[24px] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              <span class="material-symbols-outlined !text-[20px] font-bold"
                >logout</span
              >
              Déconnexion
            </button>

            <!-- Developer Signature -->
            <div
              class="flex flex-col items-center gap-4 pt-8 border-t border-brand-outline/10"
            >
              <p
                class="text-[11px] font-black tracking-[0.2em] text-brand-on-surface/30 uppercase text-center"
              >
                Développé avec ❤️ par Thomas LY
              </p>
              <div class="flex items-center gap-6">
                <a
                  href="https://github.com/lythomm"
                  target="_blank"
                  class="w-10 h-10 rounded-full bg-brand-surface border border-brand-outline/10 flex items-center justify-center text-brand-on-surface/40 hover:text-[#24292e] hover:border-[#24292e]/20 transition-all active:scale-90"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                    <path
                      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                    />
                  </svg>
                </a>
                <a
                  href="https://www.instagram.com/thom_lyy/"
                  target="_blank"
                  class="w-10 h-10 rounded-full bg-brand-surface border border-brand-outline/10 flex items-center justify-center text-brand-on-surface/40 hover:text-[#E4405F] hover:border-[#E4405F]/20 transition-all active:scale-90"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="w-5 h-5"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path
                      d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
                    ></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a
                  href="https://wa.me/33611597627"
                  target="_blank"
                  class="w-10 h-10 rounded-full bg-brand-surface border border-brand-outline/10 flex items-center justify-center text-brand-on-surface/40 hover:text-[#25D366] hover:border-[#25D366]/20 transition-all active:scale-90"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                    <path
                      d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </Transition>
    </div>

    <!-- Success Sheet -->
    <Transition
      enter-active-class="transition duration-500 cubic-bezier(0.16, 1, 0.3, 1)"
      enter-from-class="translate-y-full"
      enter-to-class="translate-y-0"
      leave-active-class="transition duration-400 ease-in"
      leave-from-class="translate-y-0"
      leave-to-class="translate-y-full"
    >
      <section
        v-if="successSheetActive"
        class="bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] border-t border-brand-outline/20 fixed inset-x-0 bottom-0 z-[70] flex flex-col transition-all duration-300 text-center"
        :class="[
          isDragging && activeDraggingSheet === 'success'
            ? 'transition-none'
            : '',
        ]"
        :style="{
          transform:
            isDragging && activeDraggingSheet === 'success'
              ? `translateY(${dragTranslateY}px)`
              : '',
        }"
      >
        <!-- Drag Handle -->
        <div
          class="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing"
          @touchstart="onSheetDragStart($event, 'success')"
          @touchmove="onSheetDragMove"
          @touchend="onSheetDragEnd"
        >
          <div class="w-10 h-1.5 bg-brand-on-surface/10 rounded-full"></div>
        </div>
        <div class="px-6 py-12">
          <div
            class="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <span
              class="material-symbols-outlined text-brand-primary text-[40px]"
              >check_circle</span
            >
          </div>
          <h2 class="text-2xl font-black mb-2">C'est réservé !</h2>
          <p class="text-brand-on-surface/50 font-bold mb-8">
            Tu as ta place pour la VendiBringue. Prépare tes chaussures de danse
            !
          </p>

          <div v-if="lastBookedRide" class="mb-10">
            <p
              class="text-[10px] font-black uppercase text-brand-on-surface/40 mb-4"
            >
              Contacter {{ lastBookedRide.profiles?.first_name }}
            </p>
            <div class="flex items-center justify-center gap-4">
              <a
                v-if="lastBookedRide.profiles?.phone"
                :href="getWhatsAppLink(lastBookedRide.profiles.phone)"
                target="_blank"
                class="w-14 h-14 bg-white border border-brand-outline/10 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/10 active:scale-95 transition-all"
                title="WhatsApp"
              >
                <img
                  src="https://img.icons8.com/color/48/whatsapp.png"
                  class="w-8 h-8"
                  alt="WhatsApp"
                />
              </a>
              <a
                v-if="lastBookedRide.profiles?.phone"
                :href="'sms:' + lastBookedRide.profiles.phone"
                class="w-14 h-14 bg-white border border-brand-outline/10 rounded-2xl flex items-center justify-center text-brand-on-surface shadow-lg active:scale-95 transition-all"
                title="Envoyer un SMS"
              >
                <span class="material-symbols-outlined text-[28px]">sms</span>
              </a>
              <a
                v-if="lastBookedRide.profiles?.instagram_id"
                :href="
                  'https://instagram.com/' +
                  lastBookedRide.profiles.instagram_id.replace('@', '')
                "
                target="_blank"
                class="w-14 h-14 bg-white border border-brand-outline/10 rounded-2xl flex items-center justify-center shadow-lg shadow-pink-500/10 active:scale-95 transition-all"
                title="Instagram"
              >
                <img
                  src="https://img.icons8.com/color/48/instagram-new.png"
                  class="w-8 h-8"
                  alt="Instagram"
                />
              </a>
            </div>
          </div>

          <button
            @click="successSheetActive = false"
            class="w-full py-4 bg-brand-on-surface text-white font-black text-lg rounded-2xl active:scale-95 transition-all"
          >
            Trop cool
          </button>
        </div>
      </section>
    </Transition>

    <!-- Avatar Picker Modal -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="isAvatarPickerOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center px-6"
      >
        <div
          class="absolute inset-0 bg-black/60 scale-105 transition-none"
          @click="isAvatarPickerOpen = false"
        ></div>
        <div
          class="bg-white rounded-[2.5rem] w-full max-w-sm relative z-10 overflow-hidden shadow-2xl"
        >
          <div class="p-8">
            <div class="flex justify-between items-center mb-8">
              <h3 class="text-xl font-black">Choisis ton avatar</h3>
              <button
                @click="isAvatarPickerOpen = false"
                class="w-8 h-8 rounded-full bg-brand-on-surface/5 flex items-center justify-center"
              >
                <span class="material-symbols-outlined !text-[18px]"
                  >close</span
                >
              </button>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <button
                v-for="index in avatarOptions"
                :key="index"
                @click="changeAvatar(index)"
                class="relative aspect-square rounded-full transition-all active:scale-95"
                :class="
                  String(index) === auth.user?.avatar_url
                    ? 'border-brand-primary bg-brand-primary/5'
                    : 'border-brand-outline/10 hover:border-brand-primary/30'
                "
              >
                <img
                  :src="getAvatarUrl(index)"
                  class="w-full h-full object-cover"
                />
                <div
                  v-if="String(index) === auth.user?.avatar_url"
                  class="absolute top-0 right-0 size-6 bg-brand-primary rounded-full flex items-center justify-center shadow-md"
                >
                  <span
                    class="material-symbols-outlined !text-[12px] text-white font-bold"
                    >check</span
                  >
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Cancel Confirmation Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showCancelConfirm"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="showCancelConfirm = false"
      >
        <div
          class="bg-white rounded-3xl p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center transform scale-100"
        >
          <div
            class="h-16 w-16 bg-[#FFF0F0] text-[#FF4B4B] rounded-full flex items-center justify-center mb-4"
          >
            <span class="material-symbols-outlined !text-[32px]">warning</span>
          </div>
          <h3 class="font-black text-xl mb-2">Libérer ma place ?</h3>
          <p class="text-brand-on-surface/60 font-medium mb-6">
            Es-tu sûr de vouloir libérer ta place dans ce covoiturage ?
          </p>
          <div class="flex gap-3 w-full">
            <button
              @click="showCancelConfirm = false"
              class="flex-1 py-3.5 bg-gray-100 text-brand-on-surface font-bold rounded-2xl active:scale-95 transition-all"
            >
              Annuler
            </button>
            <button
              @click="confirmCancelBooking"
              class="flex-1 py-3.5 bg-[#FF4B4B] text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
              :disabled="bookingLoading"
            >
              <span
                v-if="bookingLoading"
                class="material-symbols-outlined animate-spin"
                >refresh</span
              >
              <span v-else>Confirmer</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Ride Confirmation Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showDeleteRideConfirm"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="showDeleteRideConfirm = false"
      >
        <div
          class="bg-white rounded-3xl p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center"
        >
          <div
            class="h-16 w-16 bg-[#FFF0F0] text-[#FF4B4B] rounded-full flex items-center justify-center mb-4"
          >
            <span class="material-symbols-outlined !text-[32px]">delete</span>
          </div>
          <h3 class="font-black text-xl mb-2">Supprimer le trajet ?</h3>
          <p class="text-brand-on-surface/60 font-medium mb-6 text-sm">
            Es-tu sûr de vouloir supprimer ce trajet ? Toutes les réservations
            seront annulées.
          </p>
          <div class="flex gap-3 w-full">
            <button
              @click="showDeleteRideConfirm = false"
              class="flex-1 py-3.5 bg-gray-100 text-brand-on-surface font-bold rounded-2xl active:scale-95 transition-all"
            >
              Annuler
            </button>
            <button
              @click="confirmDeleteRide"
              class="flex-1 py-3.5 bg-[#FF4B4B] text-white font-bold rounded-2xl active:scale-95 transition-all"
            >
              Supprimer
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Remove Participant Confirmation Modal -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showRemoveParticipantConfirm"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
        @click.self="showRemoveParticipantConfirm = false"
      >
        <div
          class="bg-white rounded-3xl p-6 w-full max-w-[320px] shadow-2xl flex flex-col items-center text-center"
        >
          <div
            class="h-16 w-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mb-4"
          >
            <span class="material-symbols-outlined !text-[32px]"
              >person_remove</span
            >
          </div>
          <h3 class="font-black text-xl mb-2">Retirer passager ?</h3>
          <p class="text-brand-on-surface/60 font-medium mb-6 text-sm">
            Es-tu sûr de vouloir retirer ce passager de ton trajet ?
          </p>
          <div class="flex gap-3 w-full">
            <button
              @click="showRemoveParticipantConfirm = false"
              class="flex-1 py-3.5 bg-gray-100 text-brand-on-surface font-bold rounded-2xl active:scale-95 transition-all"
            >
              Annuler
            </button>
            <button
              @click="confirmRemoveParticipant"
              class="flex-1 py-3.5 bg-brand-primary text-white font-bold rounded-2xl active:scale-95 transition-all"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- iOS Install Instructions Modal -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showIOSInstructions"
        class="fixed inset-0 z-[300] bg-brand-on-surface/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        @click.self="showIOSInstructions = false"
      >
        <div
          class="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative"
        >
          <button
            @click="showIOSInstructions = false"
            class="absolute top-6 right-6 size-10 flex items-center justify-center rounded-full bg-brand-on-surface/5 hover:bg-brand-on-surface/10 transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div
            class="size-20 bg-[#4285F4]/10 rounded-[2rem] flex items-center justify-center mb-6 mx-auto"
          >
            <svg
              viewBox="0 0 384 512"
              class="w-10 h-10 text-[#4285F4] fill-current"
            >
              <path
                d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
              />
            </svg>
          </div>

          <h2 class="text-2xl font-black text-center mb-2">Sur ton iPhone</h2>
          <p class="text-center text-brand-on-surface/50 font-bold mb-8">
            Installe VendiCovoit en 2 étapes rapides :
          </p>

          <div class="space-y-6 mb-10">
            <div class="flex items-start gap-4">
              <div
                class="size-10 bg-brand-on-surface/5 rounded-full flex items-center justify-center shrink-0 font-black text-brand-primary"
              >
                1
              </div>
              <div class="pt-1.5">
                <p class="text-sm font-black mb-1 flex items-center gap-2">
                  Appuie sur
                  <span class="material-symbols-outlined text-[18px]"
                    >ios_share</span
                  >
                  Partager
                </p>
                <p
                  class="text-[12px] font-bold text-brand-on-surface/40 leading-snug"
                >
                  C'est le petit carré avec la flèche vers le haut dans ta barre
                  Safari.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                class="size-10 bg-brand-on-surface/5 rounded-full flex items-center justify-center shrink-0 font-black text-brand-primary"
              >
                2
              </div>
              <div class="pt-1.5">
                <p class="text-sm font-black mb-1 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]"
                    >add_box</span
                  >
                  Sur l'écran d'accueil
                </p>
                <p
                  class="text-[12px] font-bold text-brand-on-surface/40 leading-snug"
                >
                  Fais défiler les options et clique sur le "+". Et paf, c'est
                  installé !
                </p>
              </div>
            </div>
          </div>

          <button
            @click="showIOSInstructions = false"
            class="w-full py-4 bg-brand-accent text-white font-black text-lg rounded-2xl active:scale-95 transition-all shadow-xl shadow-brand-accent/20"
          >
            J'ai compris !
          </button>
        </div>
      </div>
    </Transition>

    <!-- Android Install Instructions Modal -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showAndroidInstructions"
        class="fixed inset-0 z-[300] bg-brand-on-surface/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        @click.self="showAndroidInstructions = false"
      >
        <div
          class="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative"
        >
          <button
            @click="showAndroidInstructions = false"
            class="absolute top-6 right-6 size-10 flex items-center justify-center rounded-full bg-brand-on-surface/5 hover:bg-brand-on-surface/10 transition-colors"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div
            class="size-20 bg-brand-android/10 rounded-[2rem] flex items-center justify-center mb-6 mx-auto"
          >
            <svg
              viewBox="0 0 448 512"
              class="w-12 h-12 text-brand-android fill-current"
            >
              <path
                d="M448 183.8v160.4c0 14.8-12 26.8-26.8 26.8h-35.4v106.3c0 14.8-12 26.8-26.8 26.8h-63V371.1h-44v133.1h-63c-14.8 0-26.8-12-26.8-26.8v-106.3H98.6c-14.8 0-26.8-12-26.8-26.8v-160.4H448zm-113.8 68.6c-11.1 0-20.2-9-20.2-20.2s9.1-20.2 20.2-20.2 20.2 9 20.2 20.2-9.1 20.2-20.2 20.2zm-220.4 0c-11.1 0-20.2-9-20.2-20.2s9.1-20.2 20.2-20.2s20.2 9 20.2 20.2-9.1 20.2-20.2 20.2zM286 151H162c-8.8 0-16-7.2-16-16s7.2-16 16-16h124c8.8 0 16 7.2 16 16s-7.2 16-16 16zm-62-119C111.4 32 18.2 110.1 2.2 211.5 1.1 218.4 6.4 225 13.4 225h421.1c7 0 12.3-6.6 11.2-13.5C429.8 110.1 336.6 32 224 32z"
              />
            </svg>
          </div>

          <h2 class="text-2xl font-black text-center mb-2">Sur ton Android</h2>
          <p class="text-center text-brand-on-surface/50 font-bold mb-8">
            Installe VendiCovoit via le menu :
          </p>

          <div class="space-y-6 mb-10">
            <div class="flex items-start gap-4">
              <div
                class="size-10 bg-brand-on-surface/5 rounded-full flex items-center justify-center shrink-0 font-black text-brand-primary"
              >
                1
              </div>
              <div class="pt-1.5">
                <p class="text-sm font-black mb-1 flex items-center gap-2">
                  Appuie sur
                  <span class="material-symbols-outlined text-[18px]"
                    >more_vert</span
                  >
                  Menu
                </p>
                <p
                  class="text-[12px] font-bold text-brand-on-surface/40 leading-snug"
                >
                  Les trois petits points en haut à droite (Chrome) ou en bas.
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                class="size-10 bg-brand-on-surface/5 rounded-full flex items-center justify-center shrink-0 font-black text-brand-primary"
              >
                2
              </div>
              <div class="pt-1.5">
                <p class="text-sm font-black mb-1 flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px]"
                    >add_to_home_screen</span
                  >
                  Installer l'app
                </p>
                <p
                  class="text-[12px] font-bold text-brand-on-surface/40 leading-snug"
                >
                  Cherche "Installer l'application" ou "Ajouter à l'écran
                  d'accueil".
                </p>
              </div>
            </div>
          </div>

          <button
            @click="showAndroidInstructions = false"
            class="w-full py-4 bg-brand-android text-white font-black text-lg rounded-2xl active:scale-95 transition-all shadow-xl shadow-brand-android/20"
          >
            C'est parti !
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

/* ========================================== */ /* === 9. STYLES & ANIMATIONS
=== */ /* ========================================== */
<style>
/* Epicenter Pulsing Marker Style */
.epicenter-marker-wrapper {
  position: relative;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 40px !important;
  height: 40px !important;
}

.epicenter-dot {
  position: absolute;
  width: 24px;
  height: 24px;
  background: var(--color-brand-primary);
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 15px
    color-mix(in srgb, var(--color-brand-primary) 40%, transparent);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.epicenter-pulse {
  position: absolute;
  width: 60px;
  height: 60px;
  background: color-mix(in srgb, var(--color-brand-primary) 20%, transparent);
  border-radius: 50%;
  animation: epicenter-heartbeat 2s ease-out infinite;
  z-index: 1;
}

.epicenter-label {
  position: absolute;
  top: 36px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  border: 1px solid
    color-mix(in srgb, var(--color-brand-primary) 10%, transparent);
  color: var(--color-brand-primary);
  white-space: nowrap;
  pointer-events: none;
  z-index: 5;
}

/* Car Markers */
.car-marker-wrapper {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.car-marker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.car-bubble {
  width: 44px;
  height: 44px;
  background: white;
  border-radius: 50%;
  border: 3px solid var(--color-brand-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.seats-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  z-index: 10;
  background: var(--color-brand-error);
  color: white;
  font-size: 10px;
  font-weight: 900;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.car-label {
  margin-top: 4px;
  background: white;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.05);
  white-space: nowrap;
}

.car-pointer {
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 8px solid white;
  margin-top: -1px;
}

@keyframes epicenter-heartbeat {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* Hide Leaflet default components for cleaner look */
.leaflet-container {
  background: var(--color-brand-map-bg) !important;
}

/* Route Line */
.leaflet-interactive {
  transition: stroke-dashoffset 0.1s linear;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 4px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

/* Simplified Marker Styles */
.car-marker-simplified-wrapper {
  display: flex !important;
  align-items: center;
  justify-content: center;
}

.car-dot {
  width: 10px;
  height: 10px;
  background: var(--color-brand-primary);
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.car-dot.is-user {
  background: var(--color-brand-accent);
  width: 12px;
  height: 12px;
}

/* Performance Layer Promotion */
.car-marker, .epicenter-pulse {
  will-change: transform;
}
</style>
