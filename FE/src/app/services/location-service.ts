import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private locationSubject = new BehaviorSubject<LocationData | null>(null);
  public location$ = this.locationSubject.asObservable();

  private watchId?: number;

  startTracking() {
    if (!navigator.geolocation) {
      console.error('Geolocation nije dostupan');
      return;
    }

    // kontinuirani tracking
    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const loc: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        this.locationSubject.next(loc);
      },
      (error) => console.error('Geolocation error:', error),
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  stopTracking() {
    if (this.watchId !== undefined) {
      navigator.geolocation.clearWatch(this.watchId);
    }
  }

  getCurrentLocation(): Promise<LocationData> {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          });
        },
        (error) => reject(error)
      );
    });
  }
}