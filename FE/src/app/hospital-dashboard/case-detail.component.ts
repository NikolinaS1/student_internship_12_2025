import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CaseModel } from '../models/case-model';
import * as L from 'leaflet';


@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './case-detail.component.html',
})
export class CaseDetailComponent implements AfterViewInit {
  @Input({ required: true }) selectedCase!: CaseModel;
  @Input() allCases: CaseModel[] = [];
  @Input() messageText = '';

  @Output() messageTextChange = new EventEmitter<string>();
  @Output() deselect = new EventEmitter<void>();
  @Output() acknowledge = new EventEmitter<number>();
  @Output() send = new EventEmitter<number>();
  @Output() caseSelect = new EventEmitter<CaseModel>();

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;

  private detailMap?: L.Map;
  private caseMarker?: L.Marker;
  private hospitalMarker?: L.Marker;
  private readonly HOSPITAL_LAT = 45.558125;
  private readonly HOSPITAL_LNG = 18.713756;

  ngAfterViewInit() {
    setTimeout(() => {
      this.scrollChatToBottom();
      this.initDetailMap();
    }, 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    // Kada se selectedCase promijeni, ažuriraj mapu
    if (changes['selectedCase'] && !changes['selectedCase'].firstChange) {
      this.updateDetailMapMarkers();
    }
  }

  ngOnDestroy() {
    this.detailMap?.remove();
  }

  scrollChatToBottom() {
    const el = this.chatScroll?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  onSend() {
    if (!this.selectedCase) return;
    this.send.emit(this.selectedCase.id);
    // scroll after parent adds the message
    setTimeout(() => this.scrollChatToBottom(), 0);
  }

  onAcknowledge() {
    if (!this.selectedCase) return;
    this.acknowledge.emit(this.selectedCase.id);
  }

  onCaseSelect(caseData: CaseModel) {
    this.caseSelect.emit(caseData);
  }

  onDeselect() {
    this.deselect.emit();
  }

  // Helper metode za prikaz podataka
  getStatusText(): string {
    switch (this.selectedCase?.status) {
      case 'ACKNOWLEDGED':
        return 'Potvrđeno';
      case 'SENT':
        return 'Poslano';
      case 'CLOSED':
        return 'Zatvoreno';
      default:
        return 'Draft';
    }
  }

  getStatusClass(): string {
    switch (this.selectedCase?.status) {
      case 'ACKNOWLEDGED':
        return 'status-acknowledged';
      case 'SENT':
        return 'status-sent';
      case 'CLOSED':
        return 'status-closed';
      default:
        return 'status-draft';
    }
  }

  getPriorityClass(): string {
    switch (this.selectedCase?.priority) {
      case 'HIGH':
        return 'priority-high';
      case 'MEDIUM':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  }

  getAge(): number | null {
    if (!this.selectedCase?.birthYear) return null;
    return new Date().getFullYear() - this.selectedCase.birthYear;
  }

  getVitalSigns(): { label: string; value: string | number; icon: string }[] {
    const vitals: { label: string; value: string | number; icon: string }[] = [];

    if (this.selectedCase?.bpm) {
      vitals.push({ label: 'Heart Rate', value: `${this.selectedCase.bpm} bpm`, icon: '❤️' });
    }
    if (this.selectedCase?.temperature) {
      vitals.push({ label: 'Temperature', value: `${this.selectedCase.temperature}°C`, icon: '🌡️' });
    }
    if (this.selectedCase?.saturation) {
      vitals.push({ label: 'O₂ Saturation', value: `${this.selectedCase.saturation}%`, icon: '💨' });
    }
    if (this.selectedCase?.resRate) {
      vitals.push({ label: 'Resp. Rate', value: `${this.selectedCase.resRate}/min`, icon: '🫁' });
    }
    if (this.selectedCase?.systolicPressure && this.selectedCase?.diastolicPressure) {
      vitals.push({
        label: 'Blood Pressure',
        value: `${this.selectedCase.systolicPressure}/${this.selectedCase.diastolicPressure} mmHg`,
        icon: '🩸',
      });
    }

    return vitals;
  }

  isActive(): boolean {
    return this.selectedCase?.status !== 'CLOSED';
  }

  isAcknowledged(): boolean {
    return this.selectedCase?.acknowledged ?? false;
  }

  private initDetailMap() {
    if (!this.selectedCase || !document.getElementById('detail-map')) return;

    this.detailMap = L.map('detail-map', { attributionControl: false }).setView(
      [this.selectedCase.latitude, this.selectedCase.longitude],
      14
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.detailMap);

    this.createMarkers();
  }

  private createMarkers() {
    const hospitalIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.hospitalMarker = L.marker([this.HOSPITAL_LAT, this.HOSPITAL_LNG], { icon: hospitalIcon })
      .addTo(this.detailMap!)
      .bindPopup('<b>KBC Osijek</b>');

    const caseIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.caseMarker = L.marker([this.selectedCase!.latitude, this.selectedCase!.longitude], { icon: caseIcon })
      .addTo(this.detailMap!)
      .bindPopup(`<b>Case #${this.selectedCase!.id}</b><br>${this.selectedCase!.patientName}`);

    this.fitMapBounds();
  }

  private updateDetailMapMarkers() {
    if (!this.detailMap || !this.selectedCase) return;

    // Ukloni stari marker
    if (this.caseMarker) {
      this.detailMap.removeLayer(this.caseMarker);
    }

    // Kreiraj novi marker za novi case
    const caseIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this.caseMarker = L.marker([this.selectedCase.latitude, this.selectedCase.longitude], { icon: caseIcon })
      .addTo(this.detailMap)
      .bindPopup(`<b>Case #${this.selectedCase.id}</b><br>${this.selectedCase.patientName}`);

    this.fitMapBounds();
  }

  private fitMapBounds() {
    if (!this.detailMap || !this.caseMarker || !this.hospitalMarker) return;

    const bounds = L.latLngBounds(
      [this.HOSPITAL_LAT, this.HOSPITAL_LNG],
      [this.selectedCase!.latitude, this.selectedCase!.longitude]
    );
    this.detailMap.fitBounds(bounds, { padding: [50, 50] });
  }
 
}