import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-overlay-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './overlay-modal.component.html',
  styleUrl: './overlay-modal.component.scss'
})
export class OverlayModalComponent {
   @Output() close = new EventEmitter<void>();
}
