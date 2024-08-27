export function setPreviousUrl(): void {
  sessionStorage.setItem('previousUrl', window.location.pathname + window.location.search);
}
