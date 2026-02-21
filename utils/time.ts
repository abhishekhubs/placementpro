export function formatRelativeTime(timestamp: number): string {
    if (!timestamp || isNaN(timestamp)) {
        return 'recently';
    }

    const now = Date.now();
    const diff = now - timestamp;

    if (isNaN(diff) || diff < 0) {
        return 'just now';
    }

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 30) {
        return 'just now';
    } else if (minutes < 1) {
        return `${seconds}s ago`;
    } else if (minutes < 60) {
        return `${minutes}m ago`;
    } else if (hours < 24) {
        return `${hours}h ago`;
    } else if (days === 1) {
        return 'yesterday';
    } else {
        return `${days}d ago`;
    }
}
