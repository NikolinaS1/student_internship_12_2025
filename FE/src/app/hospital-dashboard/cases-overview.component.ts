import { Component, AfterViewInit, OnDestroy, Output, EventEmitter, Input, inject, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgClass } from '@angular/common';
import * as L from 'leaflet';
import { WebSocketLocationService, RemoteLocation } from '../hospital-services/websocket-service';
import { CaseService } from '../hospital-services/case-store.service';
import { AuthService } from '../hospital-services/auth-service';
import { CaseModel } from '../hospital-models/case-model';
import { CaseWebSocketService } from '../hospital-services/case-websocket.service';
import { ConfigService } from '../hospital-services/config-service';

@Component({
  selector: 'app-cases-overview',
  standalone: true,
  imports: [CommonModule, NgClass],
  templateUrl: './cases-overview.component.html',
})
export class CasesOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() cases: CaseModel[] = [];
  @Output() select = new EventEmitter<CaseModel>();

  private wsService = inject(WebSocketLocationService);
  private caseService = inject(CaseService);
  private authService = inject(AuthService);
  private caseWsService = inject(CaseWebSocketService);
  private configService = inject(ConfigService);

  // Service observables
  loading = this.caseService.loading;
  error = this.caseService.error;

  private map!: L.Map;
  private markers = new Map<number, L.Marker>();
  private caseMarkers = new Map<number, L.Marker>();
  private routeLayer?: L.GeoJSON;

  private get HOSPITAL_LAT() { return this.configService.hospitalLat; }
  private get HOSPITAL_LNG() { return this.configService.hospitalLng; }

  selectedCaseEta?: { minutes: number; km: number };

  ngOnInit() {
    // Connect WebSocket for vehicle locations
    const token = this.authService.getToken();
    this.wsService.connect(token);

    // Listen for remote locations
    this.wsService.remoteLocations$.subscribe((locations) => {
      this.updateMarkers(locations);
    });

    // Listen for WebSocket messages for case updates
    this.caseWsService.message$.subscribe((message) => {
      if (!message) return;

      // Handle LOCATION_UPDATE specially to update map marker
      if (message.type === 'LOCATION_UPDATE' && message.caseId && message.latitude && message.longitude) {
        this.updateCaseMarkerLocation(message.caseId, message.latitude, message.longitude);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // Update all case locations on map
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
      const caseData = this.getCaseById(loc.caseId);

      // Use ambulance icons for vehicles
      const vehicleIcon = L.icon({
        iconUrl: caseData ? this.getCaseIconUrl(caseData) : 'assets/low priority case.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      if (!existing) {
        const marker = L.marker([loc.latitude, loc.longitude], { icon: vehicleIcon })
          .addTo(this.map)
          .bindPopup(`<b>Vehicle - Case #${loc.caseId}</b>`);

        marker.on('click', () => this.showEtaAndRoute(loc.caseId, loc.latitude, loc.longitude));
        this.markers.set(loc.caseId, marker);
      } else {
        existing.setLatLng([loc.latitude, loc.longitude]);
        // Update icon if priority changed
        if (caseData) {
          existing.setIcon(vehicleIcon);
        }
      }
    }
  }

  /**
   * Find case by ID
   */
  private getCaseById(caseId: number): CaseModel | undefined {
    return this.cases.find(c => c.id === caseId);
  }

  /**
   * Get ambulance icon URL based on priority and SOS status
   */
  private getCaseIconUrl(caseData: CaseModel): string {
    if (caseData.isSos) {
      return 'assets/images/sos case.png';
    }

    switch (caseData.priority) {
      case 'HIGH':
        return 'assets/images/high priority case.png';
      case 'MEDIUM':
        return 'assets/images/medium priority case.png';
      case 'LOW':
        return 'assets/images/low priority case.png';
      default:
        return 'assets/images/low priority case.png';
    }
  }

  private updateCaseMarkers() {
    if (!this.map) return;

    // Remove old markers
    for (const marker of this.caseMarkers.values()) {
      this.map.removeLayer(marker);
    }
    this.caseMarkers.clear();

    // Create markers for all active cases
    for (const caseData of this.cases) {
      if (caseData.isActive) {
        const caseIcon = L.icon({
          iconUrl: this.getCaseIconUrl(caseData),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

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

  /**
   * Update marker location for specific case (real-time WebSocket update)
   */
  private updateCaseMarkerLocation(caseId: number, latitude: number, longitude: number) {
    const marker = this.caseMarkers.get(caseId);

    if (marker) {
      // Update existing marker
      marker.setLatLng([latitude, longitude]);
      console.log(`📍 Map marker updated for case #${caseId}:`, latitude, longitude);
    } else {
      // If marker doesn't exist, create new one
      const caseData = this.cases.find(c => c.id === caseId);
      if (caseData && caseData.isActive) {
        const caseIcon = L.icon({
          iconUrl: this.getCaseIconUrl(caseData),
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
        });

        const marker = L.marker([latitude, longitude], { icon: caseIcon })
          .addTo(this.map)
          .bindPopup(`<b>${caseData.patientName}</b><br>Case #${caseData.id}<br>ETA: ${caseData.etaMinutes || '-'} min`);

        marker.on('click', () => {
          this.selectCaseHandler(caseData);
        });

        this.caseMarkers.set(caseId, marker);
        console.log(`📍 New map marker created for case #${caseId}:`, latitude, longitude);
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