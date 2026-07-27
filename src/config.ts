// Set EXPO_PUBLIC_API_URL in .env (or app config) to point at the API.
// Example: EXPO_PUBLIC_API_URL=https://courier101.com
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

export const PARISHES = [
  'Kingston',
  'St. Andrew',
  'St. Thomas',
  'Portland',
  'St. Mary',
  'St. Ann',
  'Trelawny',
  'St. James',
  'Hanover',
  'Westmoreland',
  'St. Elizabeth',
  'Manchester',
  'Clarendon',
  'St. Catherine',
];
