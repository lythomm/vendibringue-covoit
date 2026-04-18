<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { supabase } from "@/lib/supabase";
import L from "leaflet";

const router = useRouter();
const auth = useAuthStore();

// --- State ---
const mapContainer = ref<HTMLDivElement | null>(null);
let map: L.Map | null = null;
let epicenterMarker: L.Marker | null = null;
let userMarker: L.Marker | L.CircleMarker | null = null;
let routePolyline: L.Polyline | null = null;
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
  name: "Vendibringue 2026",
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

// --- Computed ---
const myRide = computed(() => {
  if (!auth.user) return null;
  return rides.value.find((r) => r.driver_id === auth.user?.id) || null;
});

const myBookedRides = computed(() => {
  if (!auth.user) return [];
  return rides.value.filter((r) =>
    r.bookings?.some((b: any) => b.passenger_id === auth.user?.id),
  );
});

const availableRides = computed(() => {
  const list = rides.value.filter((r) => {
    if (r.status !== "active") return false;
    if (auth.user && r.driver_id === auth.user.id) return false;
    // Hide if already booked by the user as a passenger
    if (
      auth.user &&
      r.bookings?.some((b: any) => b.passenger_id === auth.user.id)
    )
      return false;
    return true;
  });

  if (userCoords.value) {
    return [...list].sort((a, b) => {
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
  return list;
});

watch(
  availableRides,
  () => {
    updateMarkers();
  },
  { deep: true },
);

const totalAvailableSeats = computed(() =>
  availableRides.value.reduce((sum, r) => {
    const bookedCount =
      r.bookings?.filter((b: any) => b.status === "confirmed").length || 0;
    return sum + (r.total_seats - bookedCount);
  }, 0),
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

// --- Logic ---
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
      bookings ( id, passenger_id, status )
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
      maxZoom: 19,
    },
  ).addTo(map);

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

function updateMarkers() {
  if (!map) return;

  const allVisibleRides = [...availableRides.value];
  if (myRide.value) {
    allVisibleRides.push(myRide.value);
  }

  // 1. Remove markers for rides that are no longer active
  const activeIds = new Set(allVisibleRides.map((r) => r.id));
  markers.value.forEach((marker, id) => {
    if (!activeIds.has(id)) {
      marker.remove();
      markers.value.delete(id);
    }
  });

  // 2. Add or update markers for current rides
  allVisibleRides.forEach((ride) => {
    const isUserRide = ride.driver_id === auth.user?.id || isPassenger(ride.id);
    const seatsLeft = ride.total_seats - (ride.bookings?.length || 0);

    if (seatsLeft <= 0 && !isUserRide) {
      // If no seats, remove marker if exists
      if (markers.value.has(ride.id)) {
        markers.value.get(ride.id)?.remove();
        markers.value.delete(ride.id);
      }
      return;
    }

    if (markers.value.has(ride.id)) {
      markers.value.get(ride.id)?.setLatLng([ride.origin_lat, ride.origin_lng]);
    } else {
      const carIcon = L.divIcon({
        className: "car-marker-wrapper",
        html: `
          <div class="car-marker group">
            <div class="car-bubble group-active:scale-90 transition-transform" style="${
              isUserRide
                ? "background: #4285F4; box-shadow: 0 8px 25px rgba(66, 133, 244, 0.4);"
                : ""
            }">
              <span class="material-symbols-outlined text-white text-[18px]">directions_car</span>
              <div class="seats-badge">${seatsLeft}</div>
            </div>
            <div class="car-label" style="${isUserRide ? "border-color: #4285F4/20; color: #4285F4;" : ""}">${ride.profiles?.first_name}</div>
            <div class="car-pointer"></div>
          </div>
        `,
        iconSize: [50, 60],
        iconAnchor: [25, 55],
      });

      const marker = L.marker([ride.origin_lat, ride.origin_lng], {
        icon: carIcon,
      }).addTo(map!);

      marker.on("click", () => {
        selectedRide.value = ride;
        if (ride.driver_id === auth.user?.id) {
          currentRole.value = "driver";
          isSheetMinimized.value = false;
        }
      });

      markers.value.set(ride.id, marker);
    }
  });
}

// Watch for rides changes to update markers
// Watch for rides changes to update markers
watch(
  rides,
  () => {
    updateMarkers();
  },
  { deep: true },
);

async function updateRouteLine(ride: any) {
  if (!map || !eventData.value) return;

  // Clear existing line
  if (routePolyline) {
    routePolyline.remove();
  }

  const startLat = ride.origin_lat;
  const startLng = ride.origin_lng;
  const endLat = eventData.value.center_lat;
  const endLng = eventData.value.center_lng;

  const isUserRide = ride.driver_id === auth.user?.id || isPassenger(ride.id);
  const routeColor = isUserRide ? "#4285F4" : "#006A45";

  try {
    // Try OSRM for real route
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`,
    );
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates.map(
        (c: [number, number]) => [c[1], c[0]],
      );
      routePolyline = L.polyline(coordinates, {
        color: routeColor,
        weight: 6,
        opacity: 0.8,
        lineJoin: "round",
      }).addTo(map);
    } else {
      throw new Error("No route found");
    }
  } catch (err) {
    console.warn("OSRM routing failed, falling back to straight line:", err);
    // Fallback to straight line
    routePolyline = L.polyline(
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
    ).addTo(map);
  }

  // Zoom to fit the route in the upper part of the screen
  if (routePolyline) {
    map.fitBounds(routePolyline.getBounds(), {
      paddingTopLeft: [40, 80], // Padding top/left
      paddingBottomRight: [40, Math.min(window.innerHeight * 0.6, 500)], // Large bottom padding to push route up
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
    // Clear line when closed
    if (routePolyline) {
      routePolyline.remove();
      routePolyline = null;
    }
    // We no longer automatically re-zoom to center when closing to respect user navigation
  }
});

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
    showBookingError("Tu as déjà un trajet en cours !");
    return;
  }
  closeAllPanels();
  // Clear previous data
  newRide.value.origin_name = "";
  newRide.value.total_seats = 3;
  newRide.value.departure_time = "20:00";

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

  if (myRide.value) {
    showBookingError("Tu as déjà un trajet en cours !");
    return;
  }

  // Create an ISO string for today + selected time
  const today = new Date().toISOString().split("T")[0];
  const departureStr = `${today}T${newRide.value.departure_time}:00`;

  const { error } = await supabase.from("rides").insert({
    event_id: eventData.value.id,
    driver_id: auth.user?.id,
    origin_name: newRide.value.origin_name || "Ma position",
    origin_lat: pickedCoords.value.lat,
    origin_lng: pickedCoords.value.lng,
    total_seats: newRide.value.total_seats,
    departure_time: departureStr,
  });

  if (error) {
    if (error.code === "23505") {
      showBookingError("Tu as déjà un trajet actif !");
    } else {
      alert("Erreur lors de la création : " + error.message);
    }
  } else {
    pickingSheetActive.value = false;
    await fetchRides();
    currentRole.value = "driver"; // just in case
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

  if (hasPreExistingActivity.value) {
    showBookingError("Tu as déjà une réservation ou un covoit en cours !");
    return;
  }

  bookingLoading.value = true;
  const { error } = await supabase.from("bookings").insert({
    ride_id: rideId,
    passenger_id: auth.user.id,
  });

  if (error) {
    alert("Erreur lors de la réservation : " + error.message);
    bookingLoading.value = false;
  } else {
    // Save info for success screen
    lastBookedRide.value = rides.value.find((r: any) => r.id === rideId);
    selectedRide.value = null;
    bookingLoading.value = false;
    successSheetActive.value = true;
    await fetchRides();
  }
}

async function bookSeat() {
  if (!selectedRide.value || !auth.user) return;

  if (hasPreExistingActivity.value) {
    showBookingError("Tu as déjà une réservation ou un covoit en cours !");
    return;
  }

  bookingLoading.value = true;
  const { error } = await supabase.from("bookings").insert({
    ride_id: selectedRide.value.id,
    passenger_id: auth.user.id,
  });

  if (error) {
    alert("Erreur lors de la réservation : " + error.message);
    bookingLoading.value = false;
  } else {
    // Save info for success screen
    lastBookedRide.value = selectedRide.value;
    selectedRide.value = null;
    bookingLoading.value = false;
    successSheetActive.value = true;
    await fetchRides();
  }
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

// --- Realtime ---
function setupRealtime() {
  realtimeChannel = supabase
    .channel("rides_updates")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rides" },
      () => {
        fetchRides();
      },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "bookings" },
      () => {
        fetchRides();
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

// --- Lifecycle ---
// Watch for rides changes to update markers
watch(
  rides,
  () => {
    updateMarkers();
  },
  { deep: true },
);

onMounted(async () => {
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);
  initMap();
  locateMe();

  // Non-blocking fetches
  fetchEventData();
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
          <div
            class="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:shadow-brand-primary/40 transition-all"
          >
            <svg
              class="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
              />
            </svg>
          </div>
          <h1
            class="text-xl font-extrabold tracking-tight text-brand-primary font-display"
          >
            VendiBringue
          </h1>
        </div>

        <button
          @click="openProfile"
          class="w-10 h-10 rounded-full bg-brand-on-surface/[0.03] border border-brand-outline/10 flex items-center justify-center overflow-hidden hover:bg-brand-on-surface/[0.06] transition-colors"
        >
          <div class="text-sm font-bold text-brand-primary">
            {{ auth.user?.first_name?.charAt(0).toUpperCase() }}
          </div>
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
          <div class="w-0.5 h-12 bg-brand-primary absolute"></div>
          <div class="w-12 h-0.5 bg-brand-primary absolute"></div>
          <div
            class="w-4 h-4 rounded-full border-4 border-brand-primary absolute bg-white shadow-xl"
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
    <div
      v-if="!isPickingLocation"
      class="fixed top-24 right-5 flex flex-col gap-3 z-10"
    >
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
      class="mt-auto relative z-40"
    >
      <!-- Bottom Sheet -->
      <section
        class="bg-white/80 backdrop-blur-xl rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.12)] border-t border-brand-outline/20 flex flex-col transition-all duration-500 overflow-hidden"
        :class="[isSheetMinimized ? 'max-h-[40px]' : 'max-h-[75vh]']"
      >
        <!-- Drag Handle / Grabber -->
        <div
          @click="isSheetMinimized = !isSheetMinimized"
          class="w-full py-4 cursor-pointer active:bg-black/5 transition-colors"
        >
          <div
            class="w-10 h-1.5 bg-brand-on-surface/10 rounded-full mx-auto"
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
                    class="bg-white border border-brand-outline/30 p-5 rounded-[2.5rem] flex items-center gap-5 hover:shadow-xl hover:border-brand-primary/20 transition-all cursor-pointer group active:scale-[0.98]"
                  >
                    <div class="relative flex-shrink-0">
                      <div
                        class="w-16 h-16 rounded-full bg-brand-primary/5 flex items-center justify-center border border-brand-outline/20 overflow-hidden group-hover:border-brand-primary/30 transition-colors"
                      >
                        <span class="text-xl font-black text-brand-primary">
                          {{ ride.profiles?.first_name?.charAt(0) }}
                        </span>
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex justify-between items-start mb-1">
                        <span class="text-brand-on-surface font-black text-lg">
                          {{ ride.profiles?.first_name }}
                        </span>
                        <div class="flex items-center">
                          <span
                            v-if="userCoords"
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
                          <span class="text-brand-primary font-black text-lg">
                            {{ formatTime(ride.departure_time) }}
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center gap-2">
                        <span
                          class="text-sm font-bold text-brand-on-surface/60"
                        >
                          {{ ride.total_seats - (ride.bookings?.length || 0) }}
                          place{{
                            ride.total_seats - (ride.bookings?.length || 0) > 1
                              ? "s"
                              : ""
                          }}
                        </span>
                        <span
                          class="w-1 h-1 bg-brand-on-surface/20 rounded-full"
                        ></span>
                        <span
                          class="text-xs font-bold text-brand-primary/70 uppercase tracking-tighter"
                          >{{ ride.origin_name }}</span
                        >
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
            <div v-if="myRide" class="space-y-4">
              <div
                @click="selectedRide = myRide"
                class="bg-white border-2 border-[#4285F4]/10 p-5 rounded-[2.5rem] flex items-center gap-5 hover:border-[#4285F4]/30 transition-all cursor-pointer relative overflow-hidden group active:scale-[0.98]"
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
                        v-for="i in Math.min(
                          3,
                          myRide.bookings?.filter(
                            (b: any) => b.status === 'confirmed',
                          ).length || 0,
                        )"
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
      >
        <div
          class="w-10 h-1.5 bg-brand-on-surface/10 rounded-full mx-auto mt-4 mb-2"
        ></div>
        <div class="px-6 py-6 pb-12">
          <h2 class="text-2xl font-black mb-8">Derniers réglages</h2>

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
              Diffuser l'annonce
            </button>
          </div>
        </div>
      </section>
    </Transition>

    <!-- Ride Details Sheet (Passenger) -->
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
      >
        <div class="px-6 py-6 pb-12">
          <div class="flex items-center gap-4 mb-8">
            <img
              :src="
                selectedRide.profiles?.avatar_url ||
                'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
                  selectedRide.profiles?.id
              "
              class="w-16 h-16 rounded-full border-2 border-brand-primary"
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
                <p
                  v-if="userCoords"
                  class="text-brand-on-surface/50 font-bold flex items-center"
                >
                  <span
                    class="text-[10px] font-black text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full border border-brand-primary/10 mr-2 mt-1 flex items-center"
                  >
                    <span
                      class="material-symbols-outlined !text-[12px] mr-1 opacity-70"
                      >near_me</span
                    >
                    {{
                      getDistance(
                        userCoords.lat,
                        userCoords.lng,
                        selectedRide.origin_lat,
                        selectedRide.origin_lng,
                      ).toFixed(0)
                    }}
                    km
                  </span>
                </p>
              </div>
            </div>
            <div class="ml-auto text-right">
              <span class="text-3xl font-black text-brand-primary">{{
                selectedRide.total_seats - (selectedRide.bookings?.length || 0)
              }}</span>
              <p
                class="text-[10px] font-black uppercase text-brand-on-surface/40"
              >
                Place{{
                  selectedRide.total_seats -
                    (selectedRide.bookings?.length || 0) >
                  1
                    ? "s"
                    : ""
                }}
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

          <div
            class="flex items-center justify-center gap-4 mb-8 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide"
          >
            <a
              v-if="selectedRide.profiles?.phone"
              :href="getWhatsAppLink(selectedRide.profiles.phone)"
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
              v-if="selectedRide.profiles?.phone"
              :href="'tel:' + selectedRide.profiles.phone"
              class="w-14 h-14 bg-white border border-brand-outline/10 rounded-2xl flex items-center justify-center text-brand-on-surface shadow-lg active:scale-95 transition-all"
              title="Appeler"
            >
              <span class="material-symbols-outlined text-[28px]">call</span>
            </a>
            <a
              v-if="selectedRide.profiles?.instagram_id"
              :href="
                'https://instagram.com/' +
                selectedRide.profiles.instagram_id.replace('@', '')
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
              class="flex-[3] py-4 bg-brand-primary text-white font-black text-lg rounded-2xl shadow-2xl shadow-brand-primary/30 active:scale-95 transition-all"
            >
              Réserver ma place
            </button>
            <div
              v-else-if="isPassenger(selectedRide.id)"
              class="flex-[3] py-4 bg-green-50 text-green-600 font-bold rounded-2xl flex items-center justify-center gap-2 border border-green-100"
            >
              <span class="material-symbols-outlined">check_circle</span>
              Déjà réservé
            </div>
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
          <div class="px-6 py-8 flex flex-col h-full">
            <div class="flex justify-between items-center mb-8">
              <h2 class="text-2xl font-black">Mon Profil</h2>
              <button
                @click="profileSheetActive = false"
                class="w-10 h-10 rounded-full bg-brand-on-surface/[0.05] flex items-center justify-center active:scale-90 transition-transform"
              >
                <span class="material-symbols-outlined">close</span>
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

            <div v-else class="flex-1 flex flex-col">
              <div class="space-y-8 flex-1 overflow-y-auto pr-1 scrollbar-hide">
                <!-- First Name -->
                <div>
                  <label
                    class="block text-[11px] font-black uppercase tracking-widest text-brand-on-surface/40 mb-3 ml-1"
                    >Ton Prénom</label
                  >
                  <input
                    v-model="editedProfile.first_name"
                    type="text"
                    class="w-full p-4 bg-brand-on-surface/[0.03] border border-brand-outline/10 rounded-2xl font-bold outline-none focus:border-brand-primary/30 transition-all text-brand-on-surface"
                  />
                </div>

                <!-- Phone -->
                <div>
                  <label
                    class="block text-[11px] font-black uppercase tracking-widest text-brand-on-surface/40 mb-3 ml-1"
                    >WhatsApp / Tél</label
                  >
                  <input
                    v-model="editedProfile.phone"
                    type="tel"
                    class="w-full p-4 bg-brand-on-surface/[0.03] border border-brand-outline/10 rounded-2xl font-bold outline-none focus:border-brand-primary/30 transition-all text-brand-on-surface"
                  />
                </div>

                <!-- Instagram -->
                <div>
                  <label
                    class="block text-[11px] font-black uppercase tracking-widest text-brand-on-surface/40 mb-3 ml-1"
                    >Instagram</label
                  >
                  <div class="relative">
                    <span
                      class="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-brand-on-surface/30"
                      >@</span
                    >
                    <input
                      v-model="editedProfile.instagram_id"
                      type="text"
                      class="w-full p-4 pl-8 bg-brand-on-surface/[0.03] border border-brand-outline/10 rounded-2xl font-bold outline-none focus:border-brand-primary/30 transition-all text-brand-on-surface"
                    />
                  </div>
                </div>
              </div>

              <div class="pt-6 border-t border-brand-outline/5 space-y-4">
                <button
                  @click="updateProfile"
                  class="w-full py-4 bg-brand-primary text-white font-black text-lg rounded-2xl shadow-xl shadow-brand-primary/20 active:scale-95 transition-all"
                >
                  Enregistrer
                </button>

                <button
                  @click="handleLogout"
                  class="w-full py-3 text-red-500 font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <span class="material-symbols-outlined text-[18px]"
                    >logout</span
                  >
                  Se déconnecter
                </button>
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
      >
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
            Tu as ta place pour la Vendigris. Prépare tes chaussures de danse !
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
                :href="'tel:' + lastBookedRide.profiles.phone"
                class="w-14 h-14 bg-white border border-brand-outline/10 rounded-2xl flex items-center justify-center text-brand-on-surface shadow-lg active:scale-95 transition-all"
                title="Appeler"
              >
                <span class="material-symbols-outlined text-[28px]">call</span>
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
  </div>
</template>

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
  background: #006a45;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 15px rgba(0, 106, 69, 0.4);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.epicenter-pulse {
  position: absolute;
  width: 60px;
  height: 60px;
  background: rgba(0, 106, 69, 0.2);
  border-radius: 50%;
  animation: epicenter-heartbeat 2s ease-out infinite;
  z-index: 1;
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
  background: #006a45;
  border-radius: 20px;
  border: 3px solid white;
  box-shadow: 0 8px 25px rgba(0, 106, 69, 0.4);
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
  background: #ff385c;
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
  background: #fcf9f8 !important;
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
</style>
