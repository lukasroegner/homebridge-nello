// https://nellopublicapi.docs.apiary.io/#reference/0/locations-collection/list-locations
export type Location = {
  location_id: string;
  address: {
    city: string;
    state: string;
    country: string;
    zip: string;
    number: string;
    street: string;
  };
};
