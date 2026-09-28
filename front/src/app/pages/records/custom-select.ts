import { Component, Input, Output, EventEmitter } from '@angular/core';

interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  template: `
    <div class="custom-select" [class.open]="isOpen">
      <div class="select-trigger" (click)="toggle()">
        <span class="select-value">{{ selectedLabel }}</span>
        <span class="select-arrow" [class.rotated]="isOpen">▼</span>
      </div>
      @if (isOpen) {
        <div class="select-dropdown">
          @for (option of options; track option.value) {
            <div
              class="select-option"
              [class.selected]="option.value === value"
              (click)="select(option.value)"
            >
              {{ option.label }}
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CustomSelect {
  @Input() options: SelectOption[] = [];
  @Input() value: string | number = '';
  @Input() placeholder: string = 'Seleccionar';
  @Output() valueChange = new EventEmitter<string>();

  isOpen = false;

  get selectedLabel(): string {
    const selected = this.options.find((o) => o.value === this.value);
    return selected?.label ?? this.placeholder;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  select(value: string): void {
    this.value = value;
    this.valueChange.emit(value);
    this.isOpen = false;
  }
}
