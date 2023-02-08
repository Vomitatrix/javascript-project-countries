'use strict';

const countriesContainer = document.querySelector('.countries-container');
const neighboursContainer = document.querySelector('.neighbours-container');
const input = document.querySelector('.input');
const searchBtn = document.querySelector('.search-btn');
const whereAmIBtn = document.querySelector('.where-am-i-btn');

function renderCountry(data, className = '') {
    const population =
        +data.population > 1_000_000_000
            ? (+data.population / 1_000_000_000).toFixed(2) + ' billion'
            : +data.population > 1_000_000
            ? (+data.population / 1_000_000).toFixed(1) + ' million'
            : (+data.population / 1_000).toFixed(1) + ' thousand';

    const html = `
        <article class="country ${className}" data-cca3="${data.cca3}">
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

    if (className === '') {
        countriesContainer.insertAdjacentHTML('beforeend', html);
        countriesContainer.style.opacity = '1';
    }
    if (className === 'neighbour') {
        neighboursContainer.insertAdjacentHTML('beforeend', html);
        neighboursContainer.style.opacity = '1';
    }
}

function renderError(err) {
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
        if (type === 'neighbour') {
            res = await fetch(
                `https://restcountries.com/v3.1/alpha/${country}`
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

async function getNeighbours(country, type) {
    try {
        const [res] = await getJSON(country, type);
        const borders = res.borders;

        borders.forEach(country => {
            getCountry(country, type, 'neighbour');
        });
    } catch (err) {
        renderError(err);
    }
}

async function getCountry(country, type = 'search', className = '') {
    try {
        const res = await getJSON(country, type);

        res.forEach(country => {
            renderCountry(country, className);
        });
    } catch (err) {
        renderError(err);
    }
}

whereAmIBtn.addEventListener('click', e => {
    e.preventDefault();
    countriesContainer.innerHTML = '';
    neighboursContainer.innerHTML = '';
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
    countriesContainer.innerHTML = '';
    neighboursContainer.innerHTML = '';
    getCountry(input.value);
    input.value = '';
});

countriesContainer.addEventListener('click', e => {
    const countries = document.querySelectorAll('.country');
    const currCCA3 = e.target.closest('.country').dataset.cca3;

    countries.forEach(curr => {
        if (curr.dataset.cca3 !== currCCA3) curr.remove();
    });

    getNeighbours(currCCA3, 'neighbour');
});

neighboursContainer.addEventListener('click', e => {
    const currCCA3 = e.target.closest('.country').dataset.cca3;
    countriesContainer.innerHTML = '';
    neighboursContainer.innerHTML = '';

    getCountry(currCCA3, 'neighbour');
    getNeighbours(currCCA3, 'neighbour');
});
