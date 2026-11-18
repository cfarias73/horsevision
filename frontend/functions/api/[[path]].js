export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = `https://backend-production-6dd9c5f0.up.railway.app${url.pathname}${url.search}`;
  
  const headers = new Headers(context.request.headers);
  headers.set('Host', 'backend-production-6dd9c5f0.up.railway.app');

  const newRequest = new Request(targetUrl, {
    method: context.request.method,
    headers: headers,
    body: context.request.body,
    redirect: 'follow'
  });

  return fetch(newRequest);
}
