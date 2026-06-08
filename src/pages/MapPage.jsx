import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { io } from "socket.io-client";

import Sidebar from "../components/Sidebar.jsx";
import OrderModal from "../components/OrderModal.jsx";
import Notification from "../components/Notification.jsx";

import {
  MAP_CENTER,
  MAP_ZOOM,
  TILE_URL,
  TILE_ATTRIBUTION,
} from "../constants/index.js";
import {
  nearestFreeVehicle,
  randomStep,
  nowTime,
  etaMinutes,
} from "../utils/geo.js";

import styles from "./MapPage.module.css";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:4000";

export default function MapPage({
  role,
  vehicles,
  setVehicles,
  orders,
  setOrders,
  onOpenAdmin,
  onLogout,
}) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const userLatLng = useRef(null);
  const socketRef = useRef(null);
  const serverOkRef = useRef(false);

  const [selected, setSelected] = useState(null);
  const [sideOpen, setSideOpen] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const [notif, setNotif] = useState(null);
  const [gpsStatus, setGpsStatus] = useState("loading");
  const [serverConn, setServerConn] = useState(false);

  useEffect(() => {
    if (mapRef.current) return;
    const m = L.map(mapElRef.current, {
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
      zoomControl: false,
    });
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(
      m,
    );
    L.control.zoom({ position: "bottomright" }).addTo(m);
    mapRef.current = m;
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
      userMarkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus("denied");
      return;
    }
    const placeDot = (lat, lng) => {
      const m = mapRef.current;
      if (!m) return;
      userLatLng.current = { lat, lng };
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      } else {
        const icon = L.divIcon({
          html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,0.22);"></div>`,
          className: "",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const mk = L.marker([lat, lng], { icon, zIndexOffset: 1000 });
        mk.bindPopup("<b>📍 Vaša lokacija</b>");
        mk.addTo(m);
        userMarkerRef.current = mk;
        m.setView([lat, lng], 15, { animate: true });
        setGpsStatus("ok");
        push("📍 Lokacija pronađena!", "info");
      }
    };
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => placeDot(coords.latitude, coords.longitude),
      () => {
        setGpsStatus("denied");
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
    const wid = navigator.geolocation.watchPosition(
      ({ coords }) => placeDot(coords.latitude, coords.longitude),
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000 },
    );
    return () => navigator.geolocation.clearWatch(wid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const socket = io(SERVER_URL, { reconnectionAttempts: 5, timeout: 4000 });
    socketRef.current = socket;
    socket.on("connect", () => {
      setServerConn(true);
      serverOkRef.current = true;
    });
    socket.on("disconnect", () => {
      setServerConn(false);
      serverOkRef.current = false;
    });
    socket.on("connect_error", () => {
      setServerConn(false);
      serverOkRef.current = false;
    });

    socket.on("drivers:snapshot", (list) => {
      setVehicles((prev) => mergeDrivers(prev, list));
    });

    socket.on("driver:updated", (d) => {
      console.log("📡 driver updated:", JSON.stringify(d));
      setVehicles((prev) => {
        const exists = prev.find((v) => String(v.id) === String(d.driverId));
        if (exists) {
          return prev.map((v) =>
            String(v.id) === String(d.driverId)
              ? {
                  ...v,
                  lat: d.lat ?? v.lat,
                  lng: d.lng ?? v.lng,
                  status: d.status ?? v.status,
                }
              : v,
          );
        }
        return [
          ...prev,
          {
            id: d.driverId,
            name: d.name || d.driverId,
            driver: d.name || d.driverId,
            phone: "",
            lat: d.lat || MAP_CENTER[0],
            lng: d.lng || MAP_CENTER[1],
            status: d.status || "slobodan",
            live: true,
          },
        ];
      });
    });

    socket.on("driver:removed", ({ driverId }) => {
      setVehicles((prev) =>
        prev.map((v) =>
          String(v.id) === String(driverId) ? { ...v, status: "offline" } : v,
        ),
      );
    });

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (serverOkRef.current) return;
      setVehicles((prev) =>
        prev.map((v) =>
          v.status === "offline" ? v : { ...v, ...randomStep(v.lat, v.lng) },
        ),
      );
    }, 2500);
    return () => clearInterval(id);
  }, [setVehicles]);

  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    vehicles.forEach((v) => {
      if (v.lat == null || v.lng == null) return;
      const icon = buildIcon(v, selected?.id === v.id);
      if (markersRef.current[v.id]) {
        markersRef.current[v.id].setLatLng([v.lat, v.lng]);
        markersRef.current[v.id].setIcon(icon);
      } else {
        const mk = L.marker([v.lat, v.lng], { icon });
        mk.on("click", () => {
          setSelected(v);
          m.setView([v.lat, v.lng], 16, { animate: true });
        });
        mk.addTo(m);
        markersRef.current[v.id] = mk;
      }
    });
    Object.keys(markersRef.current).forEach((id) => {
      if (!vehicles.find((v) => String(v.id) === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [vehicles, selected]);

  const handlePlaceOrder = (form) => {
    const lat = userLatLng.current?.lat ?? MAP_CENTER[0];
    const lng = userLatLng.current?.lng ?? MAP_CENTER[1];
    const nearest = nearestFreeVehicle(vehicles, lat, lng);
    if (!nearest) {
      push("❌ Nema slobodnih vozila! Pozovite: 060/60-50-450", "error");
      return;
    }
    const eta = etaMinutes(nearest.km);
    const order = {
      id: Date.now(),
      ...form,
      vehicle: nearest.name,
      driver: nearest.driver,
      driverPhone: nearest.phone,
      status: "Aktivna",
      eta: eta + " min",
      time: nowTime(),
    };
    setOrders((prev) => [order, ...prev]);
    setVehicles((prev) =>
      prev.map((v) => (v.id === nearest.id ? { ...v, status: "zauzet" } : v)),
    );
    push(`✅ ${nearest.driver} je na putu! Dolazak za ~${eta} min.`, "success");
    setTimeout(() => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: "Završena" } : o)),
      );
      setVehicles((prev) =>
        prev.map((v) =>
          v.id === nearest.id ? { ...v, status: "slobodan" } : v,
        ),
      );
    }, eta * 6_000);
  };

  const push = (msg, type = "info") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 4500);
  };

  return (
    <div className={styles.layout}>
      <Sidebar
        open={sideOpen}
        role={role}
        vehicles={vehicles}
        setVehicles={setVehicles}
        orders={orders}
        selected={selected}
        onSelectVehicle={(v) => {
          setSelected(v);
          mapRef.current?.setView([v.lat, v.lng], 16, { animate: true });
        }}
        onOpenAdmin={onOpenAdmin}
        onLogout={onLogout}
        onOrderClick={() => setShowOrder(true)}
      />
      <div className={styles.mapWrap}>
        <div ref={mapElRef} className={styles.map} />
        <div className={styles.pills}>
          <div className={styles.gpsPill} data-status={gpsStatus}>
            {gpsStatus === "loading" && "⏳ GPS…"}
            {gpsStatus === "ok" && "📍 GPS aktivan"}
            {gpsStatus === "denied" && "⚠️ GPS odbijen"}
          </div>
          <div className={styles.serverPill} data-ok={serverConn}>
            {serverConn ? "🟢 Live" : "🟡 Demo mod"}
          </div>
        </div>
        <button
          className={styles.toggle}
          onClick={() => setSideOpen((p) => !p)}
        >
          {sideOpen ? "◀" : "▶"}
        </button>
      </div>
      {showOrder && (
        <OrderModal
          vehicles={vehicles}
          onClose={() => setShowOrder(false)}
          onSubmit={handlePlaceOrder}
        />
      )}
      {notif && <Notification msg={notif.msg} type={notif.type} />}
    </div>
  );
}

function mergeDrivers(existing, list) {
  const updated = [...existing];
  list.forEach((d) => {
    const idx = updated.findIndex((v) => String(v.id) === String(d.driverId));
    if (idx >= 0) {
      updated[idx] = {
        ...updated[idx],
        lat: d.lat ?? updated[idx].lat,
        lng: d.lng ?? updated[idx].lng,
        status: d.status ?? updated[idx].status,
        live: true,
      };
    } else {
      updated.push({
        id: d.driverId,
        name: d.name,
        driver: d.name,
        phone: "",
        lat: d.lat,
        lng: d.lng,
        status: d.status,
        live: true,
      });
    }
  });
  return updated;
}

const STATUS_COLOR = {
  slobodan: "#16a34a",
  zauzet: "#dc2626",
  offline: "#6b7280",
};

function carEmoji(name = "") {
  const n = name.toLowerCase();
  if (n.includes("audi")) return "🏎️";
  if (n.includes("bmw")) return "🚘";
  if (n.includes("mercedes")) return "🚙";
  if (n.includes("kia")) return "🚖";
  if (n.includes("renault")) return "🚕";
  if (n.includes("toyota")) return "🚗";
  if (n.includes("vw") || n.includes("volkswagen")) return "🚙";
  if (n.includes("skoda")) return "🚗";
  if (n.includes("opel")) return "🚙";
  return "🚖";
}

function buildIcon(vehicle, isSelected) {
  const color = STATUS_COLOR[vehicle.status] || "#6b7280";
  const pulse = vehicle.status === "slobodan" ? "pulse" : "";
  const sel = isSelected ? "sel" : "";
  const emoji = carEmoji(vehicle.name);
  const liveTag = vehicle.live
    ? `<span style="position:absolute;top:-4px;right:-4px;width:9px;height:9px;border-radius:50%;background:#ef4444;border:2px solid #fff;display:block"></span>`
    : "";
  const html = `
    <div class="cm ${pulse} ${sel}" style="--mc:${color}">
      <div class="cm-icon" style="border-color:${color};position:relative">
        ${emoji}${liveTag}
      </div>
      <div class="cm-label">${vehicle.driver}</div>
    </div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [80, 58],
    iconAnchor: [40, 28],
  });
}
