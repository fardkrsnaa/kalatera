import { Header } from './Header';
import { ClockPanel } from './ClockPanel';
import { CalendarMonth } from './CalendarMonth';
import { DetailModal } from './DetailModal';

export class AbsensiView {
  public element: HTMLElement;
  private clockPanel!: ClockPanel;
  private calendarMonth!: CalendarMonth;

  constructor() {
    this.element = document.createElement('div');
    this.element.className = 'stagger-item';
    this.render();
  }

  private render(): void {
    this.element.innerHTML = `
      <div class="fade-in-up" style="animation-delay: 0.1s;">
        <div id="header"></div>
        <div id="clock-panel"></div>
        <div id="calendar-month" style="margin-top: var(--spacing-10);"></div>
      </div>
    `;

    const header = new Header();
    header.mount(this.element.querySelector('#header')!);

    this.clockPanel = new ClockPanel();
    this.clockPanel.mount(this.element.querySelector('#clock-panel')!);

    this.calendarMonth = new CalendarMonth();
    this.calendarMonth.mount(this.element.querySelector('#calendar-month')!);

    this.element.addEventListener('showDayDetail', async (e: Event) => {
      const customEvent = e as CustomEvent;
      const { date } = customEvent.detail;
      const modal = new DetailModal(date);
      await modal.open();
    });
  }

  destroy(): void {
    this.clockPanel?.destroy();
    this.calendarMonth?.destroy();
  }
}