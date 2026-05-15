const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

const ensureLeadingSlash = (value: string): string =>
  value.startsWith('/') ? value : `/${value}`;

export const getReportApiBase = (): string => {
  const reportApiBase =
    (process.env.NEXT_PUBLIC_REPORT_API_BASE_URL || '')
      .trim()
      .replace(/\/$/, '');

  if (!reportApiBase) {
    throw new Error('Report API base URL is not configured.');
  }

  return reportApiBase;
};

export const buildReportApiUrl = (pathOrUrl: string): string => {
  if (ABSOLUTE_URL_REGEX.test(pathOrUrl)) {
    return pathOrUrl;
  }

  const reportApiBase = getReportApiBase();
  const normalizedPath = ensureLeadingSlash(pathOrUrl);
  const baseHasReportSuffix = reportApiBase.endsWith('/report');
  const pathHasReportPrefix = normalizedPath.startsWith('/report/');

  if (baseHasReportSuffix && pathHasReportPrefix) {
    return `${reportApiBase}${normalizedPath.slice('/report'.length)}`;
  }

  if (!baseHasReportSuffix && !pathHasReportPrefix) {
    return `${reportApiBase}/report${normalizedPath}`;
  }

  return `${reportApiBase}${normalizedPath}`;
};
