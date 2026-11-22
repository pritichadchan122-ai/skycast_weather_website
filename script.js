
const API_URL = "https://api.open-meteo.com/v1/forecast";

const $ = (id) => document.getElementById(id);

function formatTime(value) {
  if (!value) return "--:--";

  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getWeatherIcon(code) {
  if (code === 0) return "☀️";
  if (code <= 3) return "🌤️";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌦️";
  if (code <= 99) return "⛈️";

  return "🌤️";
}

function getWeatherText(code) {
  if (code === 0) return "Clear Sky";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Foggy";
  if (code <= 67) return "Rainy";
  if (code <= 77) return "Snowy";
  if (code <= 82) return "Rain Showers";
  if (code <= 99) return "Thunderstorm";

  return "Weather";
}

async function getWeather(city) {
  try {
    $("status").textContent = "Loading weather...";

    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
    );

    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("City not found!");
    }

    const place = geoData.results[0];

    const response = await fetch(
      `${API_URL}?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`
    );

    const data = await response.json();

    displayWeather(place, data);

    $("status").textContent = "Weather updated successfully";
  } catch (error) {
    $("status").textContent = error.message;
    $("status").classList.add("error");
  }
}

function displayWeather(place, data) {
  const current = data.current;
  const daily = data.daily;

  $("cityName").textContent = place.name;
  $("currentDate").textContent = new Date().toDateString();

  $("temperature").innerHTML =
    `${Math.round(current.temperature_2m)}<sup>°C</sup>`;

  $("conditionText").textContent =
    getWeatherText(current.weather_code);

  $("conditionPill").textContent =
    getWeatherText(current.weather_code);

  $("weatherIcon").textContent =
    getWeatherIcon(current.weather_code);

  $("feelsLike").textContent =
    `${Math.round(current.apparent_temperature)}°C`;

  $("highTemp").textContent =
    `${Math.round(daily.temperature_2m_max[0])}°`;

  $("lowTemp").textContent =
    `${Math.round(daily.temperature_2m_min[0])}°`;

  $("rainChance").textContent =
    `${daily.precipitation_probability_max[0] ?? 0}%`;

  $("sunrise").textContent = formatTime(daily.sunrise?.[0]);
  $("sunset").textContent = formatTime(daily.sunset?.[0]);

  $("metricFeels").textContent =
    `${Math.round(current.apparent_temperature)}°C`;

  $("humidity").textContent =
    `${current.relative_humidity_2m}%`;

  $("wind").textContent =
    `${current.wind_speed_10m} km/h`;

  $("windDirection").textContent =
    `${current.wind_direction_10m}°`;

  $("uv").textContent =
    daily.uv_index_max[0] ?? "--";

  $("uvLabel").textContent = "Today's UV index";

  displayForecast(daily);
}

function displayForecast(daily) {
  const forecast = $("forecast");
  forecast.innerHTML = "";

  for (let i = 0; i < 7; i++) {
    const day = new Date(daily.time[i]);

    const dayName = day.toLocaleDateString("en-US", {
      weekday: "short"
    });

    forecast.innerHTML += `
      <div class="forecast-day ${i === 0 ? "today" : ""}">
        <span class="day-name">${dayName}</span>
        <span class="day-icon">
          ${getWeatherIcon(daily.weather_code[i])}
        </span>
        <strong>
          ${Math.round(daily.temperature_2m_max[i])}°
        </strong>
        <small>
          ${Math.round(daily.temperature_2m_min[i])}° Low
        </small>
      </div>
    `;
  }
}

$("searchBtn").addEventListener("click", () => {
  const city = $("cityInput").value.trim();

  if (city) {
    $("status").classList.remove("error");
    getWeather(city);
  }
});

$("cityInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    $("searchBtn").click();
  }
});

$("locationBtn").addEventListener("click", () => {
  if (!navigator.geolocation) {
    $("status").textContent = "Location is not supported";
    return;
  }

  $("status").textContent = "Getting your location...";

  navigator.geolocation.getCurrentPosition(async (position) => {
    try {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      const response = await fetch(
        `${API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=auto`
      );

      const data = await response.json();

      displayWeather(
        { name: "Your Location" },
        data
      );

      $("status").textContent = "Location weather updated";
    } catch {
      $("status").textContent = "Unable to load weather";
    }
  }, () => {
    $("status").textContent = "Please allow location permission";
  });
});

// Default city
getWeather("Solapur");
