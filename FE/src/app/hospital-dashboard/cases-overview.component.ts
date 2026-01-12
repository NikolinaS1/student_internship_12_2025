import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, NgFor, NgClass } from '@angular/common';
import { EmsCase } from '../models/case.models';

@Component({
  selector: 'app-cases-overview',
  standalone: true,
  imports: [CommonModule, NgFor, NgClass],
  templateUrl: './cases-overview.component.html',
})
export class CasesOverviewComponent {
  @Input({ required: true }) cases: EmsCase[] = [];
  @Output() select = new EventEmitter<EmsCase>();

  isActive(c: EmsCase) {
    return c.status !== 'CLOSED';
  }
}
