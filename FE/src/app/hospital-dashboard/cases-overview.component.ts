import { Component, AfterViewInit, OnDestroy, Output, EventEmitter, Input, inject, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgClass, NgFor, NgIf, AsyncPipe } from '@angular/common';
import * as L from 'leaflet';
import { WebSocketLocationService, RemoteLocation } from '../services/websocket-service';
import { CaseService } from '../services/case-store.service';
import { AuthService } from '../services/auth-service';
import { CaseModel } from '../models/case-model';

@Component({
  selector: 'app-cases-overview',
  standalone: true,
  imports: [CommonModule, NgClass, NgFor, NgIf, AsyncPipe],
  templateUrl: './cases-overview.component.html',
})
export class CasesOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cases: CaseModel[] = []; 
  @Output() select = new EventEmitter<CaseModel>();

  private wsService = inject(WebSocketLocationService);
  private caseService = inject(CaseService);
  private authService = inject(AuthService);

  // Observable iz servisa
  loading$ = this.caseService.loading$;
  error$ = this.caseService.error$;

  private map!: L.Map;
  private markers = new Map<number, L.Marker>();
  private caseMarkers = new Map<number, L.Marker>();
  private routeLayer?: L.GeoJSON;

  private readonly HOSPITAL_LAT = 45.558125;
  private readonly HOSPITAL_LNG = 18.713756;

  selectedCaseEta?: { minutes: number; km: number };

  ngOnInit() {
    // Spoji WebSocket za lokacije vozila
    const token = this.authService.getToken();
    this.wsService.connect(token);

    // Slusaj remote lokacije
    this.wsService.remoteLocations$.subscribe((locations) => {
      this.updateMarkers(locations);
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Ažuriraj sve lokacije caseva na mapi
    if (changes['cases'] && !changes['cases'].firstChange) {
      this.updateCaseMarkers();
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    this.wsService.disconnect();
    this.map?.remove();
  }

  private initMap() {
    this.map = L.map('map', { attributionControl: false }).setView([this.HOSPITAL_LAT, this.HOSPITAL_LNG], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

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
      .bindPopup('<b>KBC Osijek</b>');

      this.updateCaseMarkers();
  }

  private updateMarkers(locations: RemoteLocation[]) {
    const activeIds = new Set(locations.map((l) => l.caseId));

    for (const [id, marker] of this.markers.entries()) {
      if (!activeIds.has(id)) {
        marker.remove();
        this.markers.delete(id);
      }
    }

    for (const loc of locations) {
      const existing = this.markers.get(loc.caseId);

      const vehicleIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      if (!existing) {
        const marker = L.marker([loc.latitude, loc.longitude], { icon: vehicleIcon })
          .addTo(this.map)
          .bindPopup(`<b>Case #${loc.caseId}</b>`);

        marker.on('click', () => this.showEtaAndRoute(loc.caseId, loc.latitude, loc.longitude));
        this.markers.set(loc.caseId, marker);
      } else {
        existing.setLatLng([loc.latitude, loc.longitude]);
      }
    }
  }

  private updateCaseMarkers() {
    if (!this.map) return;

    // Ukloni stare markere
    for (const marker of this.caseMarkers.values()) {
      this.map.removeLayer(marker);
    }
    this.caseMarkers.clear();

    // Kreiraj markere za sve aktivne caseve
    const caseIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    for (const caseData of this.cases) {
      if (caseData.isActive) {
        const marker = L.marker([caseData.latitude, caseData.longitude], { icon: caseIcon })
          .addTo(this.map)
          .bindPopup(`<b>${caseData.patientName}</b><br>Case #${caseData.id}<br>ETA: ${caseData.etaMinutes || '-'} min`);

        marker.on('click', () => {
          this.selectCaseHandler(caseData);
        });

        this.caseMarkers.set(caseData.id, marker);
      }
    }
  }

  private async showEtaAndRoute(caseId: number, fromLat: number, fromLng: number) {
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

      this.selectedCaseEta = {
        minutes: Math.round(durationSec / 60),
        km: Math.round((distanceM / 1000) * 10) / 10,
      };

      if (this.routeLayer) this.routeLayer.remove();

      this.routeLayer = L.geoJSON(route.geometry, {
        style: { color: 'blue', weight: 3, opacity: 0.7 },
      }).addTo(this.map);

      const bounds = this.routeLayer.getBounds();
      if (bounds.isValid()) this.map.fitBounds(bounds, { padding: [50, 50] });

      const caseItem = this.cases.find((c) => c.id === caseId);
      if (caseItem) {
        caseItem.etaMinutes = this.selectedCaseEta.minutes;
      }

    } catch (e) {
      console.error('OSRM error:', e);
    }
  }

  acknowledgeCaseHandler(caseId: number, event: Event) {
    event.stopPropagation();
    this.caseService.acknowledgeCase(caseId).subscribe({
      next: () => {
        console.log(`Case #${caseId} je potvrđen`);
      },
      error: (err) => console.error('Error acknowledging case:', err),
    });
  }

  selectCaseHandler(caseData: CaseModel) {
    this.caseService.selectCase(caseData);
    this.select.emit(caseData);
  }

  isActive(c: CaseModel): boolean {
    return c.isActive;
  }
}