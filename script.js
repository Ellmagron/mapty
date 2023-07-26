'use strict';

class Workout {
  // Classe pai
  date = new Date();
  id = (Date.now() + '').slice(-10); //Convertendo a data para string e pegando os últimos 10 números
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
  _setDescription() {
    //Criando uma descrição com dia/mês e exercicio
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }
}

class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cyclinh1 = new Cycling([39, -12], 27, 95, 523);
// console.log(run1, cyclinh1);

//////////////////////////////////////////////////
//////////////////////////////////////////////////
//Refatoração para Arquitetura de Projeto

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    //Get user's position
    this.#getPosition();

    //Get data from local storage
    this.#getLocalStorage();

    //Attach event handlers
    form.addEventListener('submit', this.#newWorkout.bind(this));
    inputType.addEventListener('change', this.#toggleElevationField);
    containerWorkouts.addEventListener('click', this.#moveToPopup.bind(this));
  }

  #getPosition() {
    /*  Usando API de geolocalização
  API de geolocalização tem função de callback, que recebe 2 funcções como parametro, sendo a primeira para caso API consiga obter a localização do usuario com sucesso, e a outra para caso de erro.
*/
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  #loadMap(position) {
    const { latitude, longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, 16);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    /* L.tileLayer('http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 18,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }).addTo(map); */

    /*
        Removendo a classe hidden do formuário e reatribuindo #mapevents para capturar latitude e longitude através do envento on da bibliocateca leaflet.
     */
    this.#map.on('click', this.#showForm.bind(this));

    this.#workouts.forEach(work => {
      // Exibindo o pin de exercicios a´pos o mapa ser carregado.
      this.#renderWorkoutMarker(work);
    });
  }

  #showForm(mapE) {
    //mapE é onde se encotra a latitude e longitude
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #hideForm() {
    //Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(e) {
    const validInputs = (
      ...inputs //Operador spread retorna um array.
    ) => inputs.every(inp => Number.isFinite(inp)); //Função que verificar se todos os inputs são numeros

    const allPositive = (...inputs) => inputs.every(inp => inp > 0); //Função que verificar se todos os núemros são maiores que 0

    e.preventDefault();

    //Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value; // Qualquer dado recebido do teclado é uma astring então use sinal de + para converter para número
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //Check if data is valid
    //If workout runing, create runninh object
    if (type === 'running') {
      const cadence = +inputCadence.value;
      //Check if data is valid
      if (
        // !Number.isFinite(distance) || //Clasula "guarda", basicamente verificar o oposto daquilo que está interessados, e oposto for verdadeiro, simplesmente retorna a função imediatamente.

        // !Number.isFinite(duration) ||
        // !Number.isFinite(cadence)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Input have to be positive numbers!');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //Instruções if else não estão sendo tão usada no java Script moderno, apenas if separados.

    //If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Input have to be positive numbers!');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add new object to workout array
    this.#workouts.push(workout);
    console.log(workouts);

    //Render workout on map as marker
    this.#renderWorkoutMarker(workout);

    //Render workout on list
    this.#renderWorkout(workout);

    //Hide form + clear input fields
    this.#hideForm();

    //Set local storage to all workouts
    this.#setLocalStorage();
  }

  #renderWorkoutMarker(workout) {
    /*
  Adicionando pin após clicar no mapa e prencher o formulário, 
    */
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        //Aceita um objeto de opção para personalizar o popup
        L.popup({
          maxWith: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}${workout.description}`
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    //Adicionando itens na lista de exercicios

    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon"> ${
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

    if (workout.type === 'running')
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
      `;

    if (workout.type === 'cycling')
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

    form.insertAdjacentHTML('afterend', html); //Inserindo elemento na lista
  }

  #moveToPopup(e) {
    const workoutEl = e.target.closest('.workout'); //Delegação de eventos para pegar o elemento pai mais próximo com a classe 'workout'
    console.log(workoutEl);
    if (!workoutEl) return;
    const workout = this.#workouts.find(
      //Pegando o id de dentro do array workouts
      work => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    this.#map.setView(workout.coords, 16, {
      //Movendo o mapa para o local do exercicio.
      animate: true,
      pan: {
        duration: 1,
      },
    });
    //Using the public interface

    // workout.click();
  }
  #setLocalStorage() {
    /* API de armazenamento local que está disponivel no nvaegador. */
    localStorage.setItem('workouts', JSON.stringify(this.#workouts)); //JSON.stringify converte objeto em string. Quando isso é feito a cadeia de prototipos é perdida então nenhum método será herdado.
  }

  #getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts')); //Convertendo string de volta  a objeto
    console.log(data);

    if (!data) return;
    this.#workouts = data; //Recupendo os exercicios da api local de armazenamento
    console.log(this.#workouts);

    //Adicionando excercicios na lista quando a página recarregar
    this.#workouts.forEach(work => {
      this.#renderWorkout(work);
    });
  }

  //edit workout
  editWorkout() {
    
  }

  //Delete all workouts
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
