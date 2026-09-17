import handler from '../server/index.mjs';

export default async function apiHandler(request, response) {
  return handler(request, response);
}
