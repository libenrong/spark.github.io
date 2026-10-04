import i18n from '../../../i18n';

function t(key: string) {
    return i18n.t(`common:${key}`);
}

export function humanFriendlyPercentage(percentage: number) {
    return (percentage * 100).toFixed(2) + '%';
}

export function formatTime(time: number, n = 2) {
    return parseFloat(time.toFixed(n));
}

export function formatBytes(bytes: number, n = 1) {
    if (bytes < 0) {
        return t('units.invalid');
    }
    if (bytes === 0) {
        return t('units.zeroBytes');
    }
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const sizeIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    const unit = sizeIndex === 0 ? t('units.bytes') : sizes[sizeIndex];
    return (
        parseFloat((bytes / Math.pow(1024, sizeIndex)).toFixed(n)) + ' ' + unit
    );
}

export function formatBytesShort(bytes: number, n = 1) {
    if (bytes < 0) {
        return t('units.invalid');
    }
    if (bytes === 0) {
        return t('units.zeroShort');
    }
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const sizeIndex = Math.floor(Math.log(bytes) / Math.log(1024));
    return (
        parseFloat((bytes / Math.pow(1024, sizeIndex)).toFixed(n)) +
        sizes[sizeIndex]
    );
}

export function formatDuration(duration: number) {
    const seconds = Math.abs(Math.ceil(duration / 1000));
    const h = (seconds - (seconds % 3600)) / 3600;
    const m = ((seconds - (seconds % 60)) / 60) % 60;
    const s = seconds % 60;

    let str = [];
    if (h) str.push(h + t('units.h'));
    if (m) str.push(m + t('units.m'));
    if (s) str.push(s + t('units.s'));

    return str.join(' ');
}

export function formatDate(startTime: number | string | Date) {
    const start = new Date(startTime);
    const time = start
        .toLocaleTimeString([], {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
        })
        .replace(' ', '');
    const date = start.toLocaleDateString();
    return [time, date];
}

export function formatNumber(value: number) {
    return value.toLocaleString(i18n.language, {
        maximumSignificantDigits: value > 1 ? 3 : value > 0.1 ? 2 : 1,
        useGrouping: false,
    });
}
