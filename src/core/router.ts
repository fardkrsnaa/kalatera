export type Route = 'absensi' | 'data' | 'settings';

type RouteListener = (route: Route) => void;

class Router {
  private listeners: Set<RouteListener> = new Set();
  private currentRoute: Route = 'absensi';
  private initialized = false;

  constructor() {
    this.init();
  }

  private init(): void {
    window.addEventListener('hashchange', () => this.handleHashChange());
    this.handleHashChange();
  }

  private handleHashChange(): void {
    const hash = window.location.hash.slice(1);
    const route = this.parseRoute(hash);
    const isInitial = !this.initialized;
    this.initialized = true;
    
    if (route !== this.currentRoute || isInitial) {
      this.currentRoute = route;
      this.notifyListeners();
    }
  }

  private parseRoute(hash: string): Route {
    const validRoutes: Route[] = ['absensi', 'data', 'settings'];
    return validRoutes.includes(hash as Route) ? (hash as Route) : 'absensi';
  }

  subscribe(listener: RouteListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.currentRoute));
  }

  navigate(route: Route): void {
    window.location.hash = route;
  }

  getCurrentRoute(): Route {
    return this.currentRoute;
  }
}

export const router = new Router();
