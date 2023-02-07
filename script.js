'use strict';

const countriesContainer = document.querySelector('.countries-container');
const input = document.querySelector('.input');
const searchBtn = document.querySelector('.search-btn');
const whereAmIBtn = document.querySelector('.where-am-i-btn');

function renderCountry(data, className = '') {
    countriesContainer.innerHTML = '';

    const population =
        +data.population > 1_000_000_000
            ? (+data.population / 1_000_000_000).toFixed(2) + ' billion'
            : +data.population > 1_000_000
            ? (+data.population / 1_000_000).toFixed(1) + ' million'
            : (+data.population / 1_000).toFixed(1) + ' thousand';

    const html = `
        <article class="country ${className}">
            <img class="country__img" src="${data.flags.svg}" />
            <div class="country__data">
                <h3 class="country__name">${data.name.official}</h3>
                <h4 class="country__region">${data.region}</h4>
                <p class="country__row"><span>👫</span>${population}</p>
                <p class="country__row"><span>🗣️</span>${
                    Object.entries(data.languages)[0][1]
                }</p>
                <p class="country__row"><span>💰</span>${
                    Object.entries(data.currencies)[0][1].name
                } (${Object.entries(data.currencies)[0][0]})</p>
            </div>
        </article>`;
    countriesContainer.insertAdjacentHTML('beforeend', html);
    countriesContainer.style.opacity = '1';
}

function renderError(err) {
    countriesContainer.innerHTML = '';
    countriesContainer.insertAdjacentHTML('beforeend', err);
}

async function getJSON(country, type, lat, lng) {
    return new Promise(async (resolve, reject) => {
        let res;
        if (type === 'search') {
            res = await fetch(
                `https://restcountries.com/v3.1/name/${country}`
                // 'https://restcountries.com/v3.1/all'
            );
        }
        if (type === 'reverse') {
            res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
        }

        if (!res.ok) reject(`ERROR ${res.status}: ${res.statusText}`);

        const data = await res.json();
        resolve(data);
    });
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude: lat, longitude: lng } = position.coords;
                const data = await getJSON('', 'reverse', lat, lng);
                return await data.address.country;
            },
            () => {
                alert('Could not get your position');
            }
        );
    }
}

async function getCountry(country) {
    try {
        const res = await getJSON(country, 'search');

        res.forEach(country => {
            renderCountry(country);
        });
    } catch (err) {
        renderError(err);
    }
}

whereAmIBtn.addEventListener('click', e => {
    e.preventDefault();
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude: lat, longitude: lng } = position.coords;
                const data = await getJSON('', 'reverse', lat, lng);
                getCountry(data.address.country);
            },
            () => {
                alert('Could not get your position');
            }
        );
    }
});

searchBtn.addEventListener('click', e => {
    e.preventDefault();

    getCountry(input.value);
});
