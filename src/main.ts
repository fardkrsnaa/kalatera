import './styles/index.css';
import { initStorage } from './core/storage';
import { AppShell } from './components/AppShell';

initStorage();

const app = document.querySelector<HTMLDivElement>('#app')!;

const appShell = new AppShell();
app.appendChild(appShell.element);
