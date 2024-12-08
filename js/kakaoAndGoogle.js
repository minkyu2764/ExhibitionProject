async function displayPlaceOnMap(placeName, popupElementId, mapElementId) {
  const ps = new kakao.maps.services.Places();

  // 장소명 정리
  const cleanedPlaceName = cleanPlaceName(placeName);

  return new Promise((resolve) => {
      ps.keywordSearch(cleanedPlaceName, async function (data, status) {
          if (status === kakao.maps.services.Status.OK) {
              const coords = new kakao.maps.LatLng(data[0].y, data[0].x);
              const address = data[0].road_address_name || data[0].address_name;

              // 팝업에 주소 추가
              const popup = document.getElementById(popupElementId);
              popup.innerHTML += `<p>주소: ${address}</p>`;
              const map = new kakao.maps.Map(document.getElementById(mapElementId), {
                  center: coords,
                  level: 3,
              });
              new kakao.maps.Marker({ position: coords, map });

              // 날씨 정보 가져오기
              const weatherData = await fetchWeatherForAddress(address);
              if (weatherData) {
                  popup.innerHTML += `
                      <p><strong>날씨:</strong> ${weatherData.description}</p>
                      <p><strong>최고 기온:</strong> ${weatherData.temperatureMax}°C</p>
                      <p><strong>최저 기온:</strong> ${weatherData.temperatureMin}°C</p>
                  `;
              } else {
                  popup.innerHTML += `<p>날씨 정보를 가져올 수 없습니다.</p>`;
              }

              resolve(weatherData); // 날씨 데이터 반환
          } else {
              console.error("장소를 찾을 수 없습니다:", cleanedPlaceName);
              resolve(null);
          }
      });
  });
}

// 주소 기반으로 날씨 정보 가져오기
async function fetchWeatherForAddress(address) {
  const region = extractRegion(address); // 지역 정보만 추출
  if (!region) {
      console.error("유효한 지역 정보를 찾을 수 없습니다:", address);
      return null; // 에러 시 null 반환
  }

  const geocoder = new kakao.maps.services.Geocoder();
  return new Promise((resolve) => {
      geocoder.addressSearch(region, async function (result, status) {
          if (status === kakao.maps.services.Status.OK) {
              const lat = result[0].y;
              const lon = result[0].x;

              // OpenWeatherMap API 호출
              const weatherData = await fetchWeather(lat, lon);
              resolve(weatherData); // 날씨 데이터 반환
          } else {
              console.error("좌표를 가져오지 못했습니다:", region);
              resolve(null); // 에러 시 null 반환
          }
      });
  });
}


// OpenWeatherMap API 호출
async function fetchWeather(lat, lon) {
  const apiKey = "784ab24ff2ed5d94d4288abed9e25d13"; // API 키
  const url = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=1&appid=${apiKey}&units=metric&lang=ko`;

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`HTTP 에러! 상태 코드: ${response.status}`);
      }
      const data = await response.json();
      let desc = data.list[0].weather[0].description;
      if (desc = "clear sky") {
        desc = "맑음";
      } else if (desc = "few clouds") {
        desc = "구름 조금";
      }  else if (desc = "scattered clouds") {
        desc = "흩어진 구름";
      }  else if (desc = "broken clouds") {
        desc = "구름 많음";
      }  else if (desc = "shower rain") {
        desc = "소나기";
      }  else if (desc = "rain") {
        desc = "비";
      }  else if (desc = "thunderstorm") {
        desc = "천둥번개";
      }  else if (desc = "snow") {
        desc = "눈";
      }  else if (desc = "mist") {
        desc = "안개";
      }

      return {
          description: desc,
          temperatureMax: data.list[0].temp.max,
          temperatureMin: data.list[0].temp.min,
      };
  } catch (error) {
      console.error("날씨 데이터를 가져오는 중 오류 발생:", error);
      return null;
  }
}
  
  
  function cleanPlaceName(placeName) {
    return placeName.replace(/(기획전시실|전시실|층|\d+(st|nd|rd|th)?\s*Floor|\d+\s*)/gi, '').split(",")[0].trim();
  }
  function closePopup(popupElementId) {
    document.getElementById(popupElementId).style.display = "none";
  }
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.innerText = text; // 특수 문자를 안전한 HTML 텍스트로 변환
    return div.innerHTML;
}
function extractRegion(address) {
  if (!address || typeof address !== "string") {
      console.error("유효하지 않은 주소입니다:", address);
      return null;
  }

  // 정규식으로 "서울", "대구", "부산"처럼 두 글자 도시와 "광역시", "특별시", "군", "구" 등 추출
  const match = address.match(/([가-힣]+(?:특별시|광역시|시|도|군|구))/);
  if (match && match[0]) {
      return match[0]; // 예: "서울특별시", "대구광역시", "강남구" 등 반환
  }

  // 두 글자 도시만 있는 경우 처리 (예: "서울", "대구")
  const shortMatch = address.match(/^[가-힣]{2}/);
  if (shortMatch && shortMatch[0]) {
      return shortMatch[0]; // 예: "서울", "대구"
  }

  console.error("주소에서 지역 정보를 추출할 수 없습니다:", address);
  return null;
}