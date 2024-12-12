async function fetchEvents(calendar) {
  const apiUrl = "http://api.kcisa.kr/openapi/API_CCA_145/request?serviceKey=6e774ace-4f02-4524-9b96-5960502c3754&numOfRows=20&pageNo=1";

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Accept": "application/xml",
        "Origin": "https://username.github.io/repository-name",
        "x-requested-with": "XMLHttpRequest",
      },
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const xmlText = await response.text();

    // XML → JSON 변환
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
      const contributor = item.getElementsByTagName("CONTRIBUTOR")[0]?.textContent || eventSite;

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

    // JSON 형식의 이벤트 데이터를 출력
    console.log("JSON 데이터:", JSON.stringify(events, null, 2));

    // 캘린더에 이벤트 추가
    calendar.addEventSource(events);
  } catch (error) {
    console.error("API 요청 중 오류 발생:", error);
  }
}
