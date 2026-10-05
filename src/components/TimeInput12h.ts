export interface TimeInput12hOptions {
  label: string;
  namePrefix: string;
  value?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

export class TimeInput12h {
  private container: HTMLDivElement;
  private options: TimeInput12hOptions;
  private hourSelect: HTMLSelectElement | null = null;
  private minuteSelect: HTMLSelectElement | null = null;
  private secondSelect: HTMLSelectElement | null = null;
  private periodSelect: HTMLSelectElement | null = null;

  constructor(options: TimeInput12hOptions) {
    this.options = options;
    this.container = document.createElement('div');
    this.render();
  }

  private render(): void {
    this.container.className = 'time-input-row';
    this.container.innerHTML = `
      <label class="form-label" for="${this.options.namePrefix}-hour">${this.options.label}</label>
      <div class="time-select-group">
        <select class="form-select time-select" id="${this.options.namePrefix}-hour" ${this.options.required ? 'required' : ''} aria-label="Jam">
          ${this.generateHours()}
        </select>
        <span class="time-sep">:</span>
        <select class="form-select time-select" id="${this.options.namePrefix}-minute" ${this.options.required ? 'required' : ''} aria-label="Menit">
          ${this.generateMinutesSeconds()}
        </select>
        <span class="time-sep">:</span>
        <select class="form-select time-select" id="${this.options.namePrefix}-second" ${this.options.required ? 'required' : ''} aria-label="Detik">
          ${this.generateMinutesSeconds()}
        </select>
        <select class="form-select time-select" id="${this.options.namePrefix}-period" ${this.options.required ? 'required' : ''} aria-label="AM/PM">
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    `;

    this.hourSelect = this.container.querySelector(`#${this.options.namePrefix}-hour`);
    this.minuteSelect = this.container.querySelector(`#${this.options.namePrefix}-minute`);
    this.secondSelect = this.container.querySelector(`#${this.options.namePrefix}-second`);
    this.periodSelect = this.container.querySelector(`#${this.options.namePrefix}-period`);

    if (this.options.value) {
      this.setValue(this.options.value);
    }

    [this.hourSelect, this.minuteSelect, this.secondSelect, this.periodSelect].forEach((el) => {
      el?.addEventListener('change', () => {
        const val = this.getValue();
        this.options.onChange?.(val);
      });
    });
  }

  private generateHours(): string {
    return Array.from({ length: 12 }, (_, i) => i + 1)
      .map(h => `<option value="${String(h).padStart(2, '0')}">${String(h).padStart(2, '0')}</option>`)
      .join('');
  }

  private generateMinutesSeconds(): string {
    return Array.from({ length: 60 }, (_, i) => i)
      .map(m => `<option value="${String(m).padStart(2, '0')}">${String(m).padStart(2, '0')}</option>`)
      .join('');
  }

  getValue(): string {
    if (!this.hourSelect || !this.minuteSelect || !this.secondSelect || !this.periodSelect) {
      return '';
    }
    return `${this.hourSelect.value}:${this.minuteSelect.value}:${this.secondSelect.value} ${this.periodSelect.value}`;
  }

  setValue(time12h: string): void {
    const parsed = time12h.match(/^(0[1-9]|1[0-2]):([0-5][0-9]):([0-5][0-9]) (AM|PM)$/);
    if (!parsed) return;
    if (this.hourSelect) this.hourSelect.value = parsed[1];
    if (this.minuteSelect) this.minuteSelect.value = parsed[2];
    if (this.secondSelect) this.secondSelect.value = parsed[3];
    if (this.periodSelect) this.periodSelect.value = parsed[4];
  }

  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
  }

  destroy(): void {
    this.container.remove();
  }

  get element(): HTMLDivElement {
    return this.container;
  }
}