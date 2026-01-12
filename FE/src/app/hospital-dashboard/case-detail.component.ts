import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, NgClass, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmsCase } from '../models/case.models';

@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, NgClass, FormsModule, DatePipe],
  templateUrl: './case-detail.component.html',
})
export class CaseDetailComponent implements AfterViewInit {
  @Input({ required: true }) cases: EmsCase[] = [];
  @Input({ required: true }) selectedCase!: EmsCase;

  @Input() messageText = '';
  @Output() messageTextChange = new EventEmitter<string>();

  @Output() select = new EventEmitter<EmsCase>();
  @Output() deselect = new EventEmitter<void>();
  @Output() acknowledge = new EventEmitter<string>();
  @Output() send = new EventEmitter<string>();

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;

  isActive(c: EmsCase) {
    return c.status !== 'CLOSED';
  }

  ngAfterViewInit() {
    // initial scroll when detail view opens
    setTimeout(() => this.scrollChatToBottom(), 0);
  }

  scrollChatToBottom() {
    const el = this.chatScroll?.nativeElement;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  onSend() {
    this.send.emit(this.selectedCase.id);
    // scroll after parent adds the message
    setTimeout(() => this.scrollChatToBottom(), 0);
  }
}

