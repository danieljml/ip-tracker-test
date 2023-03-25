const CONTENT = document.querySelector('.content');
const ALERT = document.querySelector('.alert');
const FORM = document.querySelector('#form-ip');
const LOCATION_DATA = [
  { class: 'content__address', title: 'IP ADDRESS' },
  { class: 'content__location', title: 'LOCATION' },
  { class: 'content__timezone', title: 'TIMEZONE' },
  { class: 'content__isp', title: 'ISP' },
];
const IP_REGEX =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
let creatingMap = L.map('map');
let isFirstLoading = true;

CONTENT.innerHTML = LOCATION_DATA.map(ele => {
  return `
    <div class="${ele.class}">
      <span>${ele.title}</span>
      <p></p>
    </div>
  `;
}).join('');

const openPopup = ({ message, type }) => {
  ALERT.innerHTML = `<p class='popup__content ${type}'>${message}</p>`;
  ALERT.classList.add(type);
  setTimeout(() => {
    ALERT.classList.remove(type);
  }, 3000);
};

FORM.addEventListener('submit', e => {
  e.preventDefault();
  try {
    const formData = new FormData(FORM);
    const { ip: clientIP } = Object.fromEntries(formData.entries());
    if (!clientIP) {
      throw { message: 'Please introduce a IP', type: 'error' };
    }
    if (!IP_REGEX.test(clientIP)) {
      throw { message: 'Invalid IP', type: 'error' };
    }
    openPopup({ message: 'Send successfully', type: 'success' });
    getLocationByIP(clientIP);
    FORM.reset();
    isFirstLoading = false;
  } catch (error) {
    openPopup(error);
    FORM.reset();
  }
});

navigator.geolocation.getCurrentPosition(position => {
  getUserCoords(position);
  getUserIP();
});

function getUserCoords({ coords }) {
  let { latitude, longitude } = coords;
  creatingMap.setView([latitude, longitude], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(creatingMap);

  L.marker([latitude, longitude]).addTo(creatingMap).bindPopup('You are here.').openPopup();
}

async function getUserIP() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const { ip: clientIP } = await response.json();
    getLocationByIP(clientIP);
  } catch (error) {
    console.error(error);
  }
}

async function getLocationByIP(clientIP) {
  try {
    const res = await fetch(`https://o5g8n7-8080.csb.app/${clientIP}`);
    const data = await res.json();
    console.log('User IP Address:', data);
    const { ip, city, timezone, org, loc: coords } = data;

    const tagList = Object.entries(CONTENT.childNodes)
      .map(item => (item[0] % 2 !== 0 ? item[1].childNodes[3] : null))
      .filter(Boolean);

    const [ipTag, locationTag, timezoneTag, ispTag] = tagList;
    ipTag.textContent = ip;
    locationTag.textContent = city;
    timezoneTag.textContent = timezone;
    ispTag.textContent = org;

    const [latitude, longitude] = coords.split(',').map(parseFloat);
    const position = {
      coords: {
        latitude,
        longitude,
      },
    };
    creatingMap.invalidateSize();
    if (!isFirstLoading) {
      getUserCoords(position);
    }
  } catch (error) {
    console.error('Error fetching IP:', error);
  }
}
