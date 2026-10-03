import './styles/index.css';
import { initStorage } from './core/storage';
import { Header } from './components/Header';
import { ClockPanel } from './components/ClockPanel';
import { CalendarMonth } from './components/CalendarMonth';
import { DetailModal } from './components/DetailModal';

initStorage();

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="container">
    <div id="header" class="fade-in"></div>
    <div id="clock-panel" class="fade-in-up" style="animation-delay: 0.1s;"></div>
    <div id="calendar-month" class="fade-in-up" style="margin-top: var(--spacing-10); animation-delay: 0.2s;"></div>
  </div>
`;

const header = new Header();
header.mount(document.getElementById('header')!);

const clockPanel = new ClockPanel();
clockPanel.mount(document.getElementById('clock-panel')!);

const calendarMonth = new CalendarMonth();
calendarMonth.mount(document.getElementById('calendar-month')!);

window.addEventListener('showDayDetail', async (e: Event) => {
  const customEvent = e as CustomEvent;
  const { date } = customEvent.detail;
  const modal = new DetailModal(date);
  await modal.open();
});
