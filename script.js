'use strict';

class Workout {
  date = new Date(); // when did workout happen?
  id = (Date.now() + '').slice(-10); // convert date to str, take last 10 digits as unique ID

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in kms
    this.duration = duration; // in minutes
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDay()}
    `;
    console.info('New workout description ' + this.description);
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration); // pass args to parent workout class
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km / hr
    this.speed = this.distance / (this.duration / 60); // duration is in min, we want hours
    return this.speed;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); // pass args to parent workout class
    this.cadence = cadence;
    this.calcPace(); // get min per km on init
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

// const run1 = new Running([44.66, -124.06776], 3, 20, 178);
// const cycle1 = new Cycling([44.5655, -124.7655], 10, 30, 500);

// console.log(run1);
// console.log(cycle1);

/////////////////////////////////////////
// APPLICATION ARCHITECTURE

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map; // leafly map obj
  #mapEvent; // map click event obj
  #workouts = []; // placeholder array to store workout objects
  #mapDefaultZoom = 13;
  constructor() {
    // get users position
    this._getPosition();

    // get data from local storage
    this._getLocalStorage();

    //event listener when enter is hit and submit called on form
    form.addEventListener('submit', this._newWorkout.bind(this)); // bind this so we can ref app props in callback func
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this)); // bind this so we can ref app props in callback func
  }
  /**
   * method called in constructor with loadMap as callback function
   */
  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this), // success callback to load map with cur location
        function () {
          alert('Unable to get your position'); // on fail, alert user we can't get location
        }
      );
    }
  }
  /**
   * method to call in app constructor; renders map using position and sets map property
   * @param  {} position position obj from navigator.geolocation.getCurrentPosition call
   */
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    this.#map = L.map('map').setView(
      [latitude, longitude],
      this.#mapDefaultZoom
    );

    // add leaflet tile layer from openstreetmap
    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }
  /**
   * show input form on left panel
   * @param  {} mapE map event from clicking leaflet map
   */
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';

    // prevent sliding of next form item up
    form.style.display = 'none'; // hack; hide form for a moment
    form.classList.add('hidden'); // then hide
    setTimeout(() => (form.style.display = 'grid'), 1000); // after one second set display back to grid
  }

  _moveToPopup(e) {
    // regardless of what child clicked, move up html to closest workout container parent
    const workoutEl = e.target.closest('.workout');
    console.info(workoutEl);

    if (!workoutEl) return; // handle when user clicks in container but not on workout row

    // find workout in workouts array that matches element ID
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    console.info(workout);
    this.#map.setView(workout.coords, this.#mapDefaultZoom);
  }

  /**
   * toggle elevation/cadence input depending on what type of excercise
   */
  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  /**
   * create new workout obj, reset form vals, add to map
   * @param  {} e event from 'submit' on form
   */
  _newWorkout(e) {
    /*
    method called when creating a new workout entry
    e: event obj from form 'submit'
    */
    e.preventDefault(); // prevents refresh after submit
    // get data from form inputs
    const type = inputType.value; // string type value defined in index.html (running | cycling)
    const distance = +inputDistance.value; // convert to number with +
    const duration = +inputDuration.value; // convert to number with +
    const { lat, lng } = this.#mapEvent.latlng; // use to add marker from map click event
    let workout;

    // return true if all inputs are numbers, else return false
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));

    // return true if all inputs are pos, else return false
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    // if running, create new cycling workout
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // guard clause to validate cadence is pos number
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs must be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if cycling, create new running workout
    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;

      // guard clause to validate elevation gain is pos number
      if (
        !validInputs(distance, duration, elevationGain) ||
        !allPositive(distance, duration) // elevation gain can be negative, so omitting here
      )
        return alert('Inputs must be positive numbers');

      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    // add workout obj to workouts array
    this.#workouts.push(workout);
    console.log(`${type} workout created!`);
    console.log(workout);

    // render workout on map
    this._renderWorkoutMarker(workout);

    // render workout on left-side list
    this._renderWorkoutListItem(workout);

    // hide form and clear input values
    this._hideForm();

    // set local storege
    this._setLocalStorage();
  }

  // add workouts to local storage in browser
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  // retrieve workouts from local storage
  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.info(data);

    if (!data) return;

    this.#workouts = data;
    this.#workouts.forEach(work => {
      this._renderWorkoutListItem(work);
    });
  }

  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          autoClose: false, // keep other popups open
          closeOnClick: false, // keep other popups open
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }
  /**
   * Build HTML template and insert back to DOM
   * @param  {} workout workout object, either cycling or running
   */
  _renderWorkoutListItem(workout) {
    let html = `
    <li class="workout workout--${workout.type}" data-id="${workout.id}">
    <h2 class="workout__title">${workout.description}</h2>
    <div class="workout__details">
      <span class="workout__icon">${
        workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
      }</span>
      <span class="workout__value">${workout.distance}</span>
      <span class="workout__unit">km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⏱</span>
      <span class="workout__value">${workout.duration}</span>
      <span class="workout__unit">min</span>
    </div>
    `;

    if (workout.type === 'running') {
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.pace.toFixed(1)}</span>
      <span class="workout__unit">min/km</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">🦶🏼</span>
      <span class="workout__value">${workout.cadence}</span>
      <span class="workout__unit">spm</span>
    </div>
    </li>
        `;
    }

    if (workout.type === 'cycling') {
      html += `
    <div class="workout__details">
      <span class="workout__icon">⚡️</span>
      <span class="workout__value">${workout.speed.toFixed(1)}</span>
      <span class="workout__unit">km/h</span>
    </div>
    <div class="workout__details">
      <span class="workout__icon">⛰</span>
      <span class="workout__value">${workout.elevationGain}</span>
      <span class="workout__unit">m</span>
    </div>
    </li>
        `;
    }

    form.insertAdjacentHTML('afterend', html);
  }
}

const app = new App();
