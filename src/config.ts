// Local development can override this in .env. Release builds must stay usable
// when that gitignored file is absent from the cloud build environment.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, '') || 'https://courier101.com';

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
