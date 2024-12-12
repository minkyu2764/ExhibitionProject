async function fetchEvents(calendar) {
  const proxyUrl = "https://cors-anywhere.herokuapp.com/";
  const apiUrl = `${proxyUrl}https://api.kcisa.kr/openapi/API_CCA_145/request?serviceKey=05e92b15-d0c6-4a60-9f1c-7e0aa4596138&numOfRows=10&pageNo=1`;

  try {
    const response = await fetch(apiUrl);
    const xmlText = await response.text();

    // XML -> JSON 변환
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");
    const items = xmlDoc.getElementsByTagName("item");
    const events = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = item.getElementsByTagName("TITLE")[0]?.textContent || "제목 없음";
      const url = item.getElementsByTagName("URL")[0]?.textContent || null;
      const eventSite = item.getElementsByTagName("EVENT_SITE")[0]?.textContent || "지역 정보 없음";
      const period = item.getElementsByTagName("PERIOD")[0]?.textContent || null;
      const contributor = item.getElementsByTagName("CONTRIBUTOR")[0]?.textContent || item.getElementsByTagName("EVENT_SITE")[0]?.textContent

      if (period) {
        const [startDate, endDate] = period.split("~").map(date => date.trim());
        events.push({
          title,
          start: startDate,
          end: endDate,
          allDay: true,
          url,
          extendedProps: {
            event_site: eventSite,
            contributor,
          },
        });
      }
    }

    console.log("캘린더에 추가될 이벤트:", events);
    calendar.addEventSource(events);
  } catch (error) {
    console.error("API 요청 중 오류 발생:", error);
  }
}
