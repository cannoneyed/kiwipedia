export function getFinalUrlPiece(url) {
  const urlPieces = url.split('/');
  return urlPieces[urlPieces.length - 1];
}

// Gets the number of monthly page views on March-April 2023
export async function getPageViews(pageId) {
  const BASE_URL =
    'https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/all-agents';
  const url = `${BASE_URL}/${pageId}/monthly/2023030100/2023040100`;
  const response = await fetch(url);
  const json = await response.json();
  const views = json.items.reduce((acc, item) => acc + item.views, 0);
  return views;
}
