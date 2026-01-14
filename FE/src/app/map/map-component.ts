import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { WebSocketLocationService, RemoteLocation } from '../services/websocket-service';
import { LocationService, LocationData } from '../services/location-service';
import { AuthService } from '../services/auth-service';

@Component({
  selector: 'app-hospital-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="map-container">
      <div id="map" class="map"></div>
      <div class="eta-panel" *ngIf="eta">
        <div><b>ETA:</b> {{ eta.minutes }} min</div>
        <div><b>Udaljenost:</b> {{ eta.km }} km</div>
      </div>
    </div>
  `,
  styles: [`
    .map-container { position: relative; height: 100%; }
    .map { height: 100%; border-radius: 12px; }
    .eta-panel {
      position: absolute; right: 12px; bottom: 12px;
      background: white; padding: 10px 12px; border-radius: 10px;
      box-shadow: 0 8px 30px rgba(0,0,0,.12);
      font-size: 14px; z-index: 999;
    }
  `]
})
export class HospitalMapComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;
  private markers = new Map<number, L.Marker>();
  private routeLayer?: L.GeoJSON;

  private wsService = inject(WebSocketLocationService);
  private locService = inject(LocationService);
  private authService = inject(AuthService);

  // Hardkodirana lokacija bolnice u Osijeku
  private readonly HOSPITAL_LAT = 45.557867;
  private readonly HOSPITAL_LNG = 18.713800;

  eta?: { minutes: number; km: number };

  ngAfterViewInit() {
    this.initMap();

    // spoji WebSocket i počni hvatati lokacije
    const token = this.authService.getToken();
    this.wsService.connect(token);
    this.locService.startTracking();

    // slusaj remote lokacije
    this.wsService.remoteLocations$.subscribe((locations) => {
      this.updateMarkers(locations);
    });
  }

  ngOnDestroy() {
    this.wsService.disconnect();
    this.locService.stopTracking();
    this.map?.remove();
  }

  private initMap() {
    this.map = L.map('map').setView([this.HOSPITAL_LAT, this.HOSPITAL_LNG], 13);

    // OSM tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // marker bolnice
    const hospitalIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    L.marker([this.HOSPITAL_LAT, this.HOSPITAL_LNG], { icon: hospitalIcon })
      .addTo(this.map)
      .bindPopup('<b>Bolnica - KBC Osijek</b>');
  }

  private updateMarkers(locations: RemoteLocation[]) {
    const activeIds = new Set(locations.map((l) => l.caseId));

    // makni markere koji više nisu aktivni
    for (const [id, marker] of this.markers.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }

    // upsert markeri
    for (const loc of locations) {
      const existing = this.markers.get(loc.caseId);

      const icon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      if (!existing) {
        const marker = L.marker([loc.latitude, loc.longitude], { icon })
          .addTo(this.map)
          .bindPopup(`<b>Case #${loc.caseId}</b>`);

        marker.on('click', () => this.showEtaAndRoute(loc.latitude, loc.longitude));
        this.markers.set(loc.caseId, marker);
      } else {
        existing.setLatLng([loc.latitude, loc.longitude]);
      }
    }
  }

  private async showEtaAndRoute(fromLat: number, fromLng: number) {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${fromLng},${fromLat};${this.HOSPITAL_LNG},${this.HOSPITAL_LAT}` +
      `?overview=full&geometries=geojson`;

    try {
      const res = await fetch(url).then((r) => r.json());
      const route = res.routes?.[0];
      if (!route) return;

      const durationSec = route.duration;
      const distanceM = route.distance;

      this.eta = {
        minutes: Math.round(durationSec / 60),
        km: Math.round((distanceM / 1000) * 10) / 10,
      };

      if (this.routeLayer) this.routeLayer.remove();

      this.routeLayer = L.geoJSON(route.geometry, {
        style: { color: 'blue', weight: 3, opacity: 0.7 },
      }).addTo(this.map);

      const bounds = this.routeLayer.getBounds();
      if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [30, 30] });

    } catch (e) {
      console.error('OSRM error:', e);
    }
  }
}